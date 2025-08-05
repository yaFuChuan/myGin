package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"math/rand"
	"os"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/gocolly/colly/v2"
)

var baseURL = "https://www.officeholidays.com/countries/"
var country = "taiwan"
var optputFileName = "holiday"

// var yearsList = []string{"2022", "2023", "2024", "2025", "2020", "2021"}

var targetDateFormat = "20060102"
var logFormat = "%-8s%s"

// Holiday struct to represent each holiday entry
type Holiday struct {
	Day         string
	Date        string
	HolidayName string
	HolidayType string
	IsHoliday   bool
	Comments    string
}

func holidays() {

	var allHolidays []Holiday
	yearsList := getYearsList(time.Now().Year(), 5, 1)

	for _, year := range yearsList {

		var holidays []Holiday

		// Constructing the URL for the specific year
		// Example: https://www.officeholidays.com/countries/taiwan/2024
		url := fmt.Sprintf("%s%s/%s", baseURL, country, year)

		// Creating a new Collector instance
		// Setting a custom User-Agent header to mimic a common web browser (Chrome on Windows)
		c := colly.NewCollector()

		c.OnRequest(setUserAgent)

		// Applying rate limiting to the Collector to avoid making requests too quickly
		c.Limit(&colly.LimitRule{
			DomainGlob: "*",
			RandomDelay: 2 * time.Second,
		})

		c.OnResponse(func(r *colly.Response) {
			log.Printf(logFormat, "[INFO]", fmt.Sprintf("Visited: %s", r.Request.URL))

		})

		// Setting up a callback for HTML element tr in tbody
		c.OnHTML("tbody tr", func(e *colly.HTMLElement) {

			// Parsing and storing data in holidays slice
			holiday := parseToHoliday(e)
			holidays = append(holidays, holiday)
		})

		// Setting up an error callback
		c.OnError(func(r *colly.Response, err error) {
			log.Printf(logFormat, "[ERROR]", fmt.Sprintf("Error: %s: Request URL: %s", err, r.Request.URL))
		})

		// Visiting the specified URL to fetch holidays data
		err := c.Visit(url)
		if err != nil {
			continue
		}

		finalHolidays := addCompensatedHolidays(holidays, year)
		allHolidays = append(allHolidays, finalHolidays...)
	}

	// printTable(allHolidays)
	allHolidays = addExtendedDays(allHolidays)
	allHolidays = sortTableByDate(allHolidays)

	err := writeCSV(allHolidays)
	if err != nil {
		log.Printf(logFormat, "[ERROR]", fmt.Sprintf("Write CSV: %s", err))
	}

}

// getYearsList generates a list of years, including the current year and a specified number of preceding and following years.
func getYearsList(currentYear, preYears int, follYears int) []string {
	totalYearsRange := preYears + follYears + 1
	currentYear = currentYear - preYears
	yearsList := make([]string, totalYearsRange)

	for i := 0; i < totalYearsRange; i++ {
		yearsList[i] = fmt.Sprint(currentYear + i)
	}

	log.Printf(logFormat, "[INFO]", fmt.Sprintf("Set List of Years: %s", yearsList))
	return yearsList
}

// setUserAgent sets random custom headers to simulate a real user
func setUserAgent(r *colly.Request) {

	userAgentList := []string{
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36",
		"Mozilla/5.0 (iPhone; CPU iPhone OS 14_4_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.141 Safari/537.36 Edg/87.0.664.75",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18363",
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
	}
	randomIndex := rand.Intn(len(userAgentList))

	r.Headers.Set("User-Agent", userAgentList[randomIndex])
	r.Headers.Set("Accept-Language", "en-US,en;q=0.9")

	log.Printf(logFormat, "[INFO]", fmt.Sprintf("Set Random Header: %s", userAgentList[randomIndex]))
}

// parseToHoliday parses HTML element and returns a Holiday struct
func parseToHoliday(e *colly.HTMLElement) Holiday {
	// Extracting values from HTML elements
	day := e.ChildText("td:nth-child(1)")
	originalDate := e.ChildAttr("td:nth-child(2) time", "datetime")
	holidayName := e.ChildText("td:nth-child(3) a")
	holidayType := e.ChildText("td:nth-child(4)")
	comments := e.ChildText("td:nth-child(5)")

	// Parsing original date to time.Time for formatting
	tmpDate, _ := time.Parse("2006-01-02", originalDate)
	// Formatting date to the desired output format ("20240101")
	outDateFormat := tmpDate.Format(targetDateFormat)

	// Checking if it's a public holiday or weekend
	isHoliday := (!strings.Contains(holidayType, "Not A Public Holiday") || strings.Contains(day, "Saturday") || strings.Contains(day, "Sunday"))

	return Holiday{
		Day:         day,
		Date:        outDateFormat,
		HolidayName: holidayName,
		HolidayType: holidayType,
		IsHoliday:   isHoliday,
		Comments:    comments,
	}
}

// createCSVFile creates a CSV file with the specified filename
func createCSVFile() (*os.File, error) {
	file, err := os.Create(fmt.Sprintf("%s.csv", optputFileName))
	if err != nil {
		return nil, err
	}
	return file, nil
}

// writeCSV writes holidays data to CSV file
func writeCSV(holidays []Holiday) error {

	log.Printf(logFormat, "[INFO]", "Save Data To CSV File")

	// Creating a CSV file for the specific year
	csvFile, err := createCSVFile()
	if err != nil {
		log.Printf(logFormat, "[ERROR]", fmt.Sprintf("Create CSV File: %s", err))
	}
	defer csvFile.Close()

	// Creating a CSV writer
	writer := csv.NewWriter(csvFile)
	defer writer.Flush()

	// Writing header
	header := []string{"Day", "Date", "Holiday Name", "Holiday Type", "Is Holiday", "Comments"}
	err = writer.Write(header)
	if err != nil {
		log.Printf(logFormat, "[ERROR]", fmt.Sprintf("Write CSV Header: %s", err))
	}

	// Writing data
	for _, h := range holidays {
		row := []string{h.Day, h.Date, h.HolidayName, h.HolidayType, boolToString(h.IsHoliday), h.Comments}
		err := writer.Write(row)
		if err != nil {
			log.Printf(logFormat, "[ERROR]", fmt.Sprintf("Writing Data: %s", err))
		}
	}

	return nil
}

// boolToString converts bool to string
func boolToString(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

// addCompensatedHolidays processes a slice of original Holidays and adds compensatory holidays based on specific criteria.
// It returns a new slice of Holidays containing both the original and compensatory holidays.
func addCompensatedHolidays(original []Holiday, year string) []Holiday {

	var compensatedHolidays []Holiday

	for _, row := range original {
		// Check if the Comments field contains "Compensated by"
		if strings.Contains(row.Comments, "Compensated by") {
			// Parse the compensated day and date from the Comments field
			compensatedDay, compensatedDate := parseCompensatedDate(row.Comments, year)
			// Check if parsing was successful and compensatedDay is not an empty string
			if compensatedDay != "" {
				// Define details for the compensatory holiday
				compensatedHolidayName := "Compensatory workday"
				compensatedType := "Compensated"
				compensatedIsHoliday := false
				compensatedComments := "Makeup day for " + row.HolidayName

				// Create a new Holiday struct for the compensatory holiday
				compensatedHolidays = append(compensatedHolidays, Holiday{
					Day:         compensatedDay,
					Date:        compensatedDate,
					HolidayName: compensatedHolidayName,
					HolidayType: compensatedType,
					IsHoliday:   compensatedIsHoliday,
					Comments:    compensatedComments,
				})
			}
		}

		compensatedHolidays = append(compensatedHolidays, row)
	}

	return compensatedHolidays
}

// parseCompensatedDate parses the "Compensated by" information in the Comments field to extract compensated day and date.
// It takes the Comments string and the current year as input and returns the compensated day and date in the specified format.
func parseCompensatedDate(comments string, year string) (string, string) {

	// Define a regular expression pattern to match the "Compensated by" information
	re := regexp.MustCompile(`Compensated by ((\S+) (\S+|\d+) (\S+|\d+))`)
	matches := re.FindStringSubmatch(comments)

	// Check if there is a match and the first capture group is not empty
	if len(matches) > 1 && len(matches[1]) > 0 {
		// Combine the matched date information with the provided year and parse it to a consistent format
		dateStr := parseDate(matches[1] + " " + year)

		// Convert the parsed date string to a time.Time object
		t, err := convertToDate(dateStr)
		if err != nil {
			log.Printf(logFormat, "[ERROR]", fmt.Sprintf("Parsing Date: %s", err))
			// log.Printf("Error parsing date: %v\n", err)
			return "", ""
		}

		// Extract the compensated day and format the compensated date
		compensatedDay := t.Weekday().String()
		compensatedDate := t.Format(targetDateFormat)

		return compensatedDay, compensatedDate
	}
	return "", ""
}

// parseDate takes an input date string and formats it to a consistent format.
func parseDate(inputDateStr string) string {

	// It checks if the input date string already contains periods (.), indicating a pre-formatted date.
	// If it does, the original input date string is returned. Otherwise, it reformat the date and returns the updated date string.
	parts := strings.Fields(inputDateStr)

	if strings.Contains(parts[0], ".") {
		return inputDateStr
	} else {
		dateStr := fmt.Sprintf("%s. %s %s %s", parts[0], parts[2], parts[1], parts[3])
		return dateStr
	}
}

// convertToDate takes a date string and attempts to parse it using multiple date formats.
// It iterates over a list of predefined date formats and attempts to parse the date string.
func convertToDate(dateStr string) (time.Time, error) {

	var t time.Time
	var err error

	// Define a list of date formats to attempt parsing
	dateFormats := []string{"Mon. Jan 2 2006", "Mon. January 2 2006", "Mon. Jan. 2 2006", "Monday. January 2 2006", "Monday. Jan 2 2006", "Monday. Jan. 2 2006", "Monday. 2th January 2006"}

	// Exceptionally format. Check if dateStr contains "Sept." and replace it with "Sep."
	dateStr = strings.Replace(dateStr, "Sept.", "Sep.", -1)

	// Iterate over each date format and attempt to parse the date string
	for _, format := range dateFormats {
		t, err = time.Parse(format, dateStr)
		if err == nil {
			break
		}
	}

	return t, err
}

// sortTableByDate takes a slice of Holiday objects and sorts them based on the Date field in ascending order.
func sortTableByDate(holidays []Holiday) []Holiday {

	sort.Slice(holidays, func(i, j int) bool {
		return holidays[i].Date < holidays[j].Date
	})

	return holidays
}

func printTable(table []Holiday) {
	formatString := "%-10s%-12s%-35s%-30s%-20v%-20s\n"

	fmt.Printf(formatString, "Day", "Date", "Holiday Name", "Holiday Type", "Is Holiday", "Comments")
	for _, row := range table {
		fmt.Printf(formatString, row.Day, row.Date, row.HolidayName, row.HolidayType, row.IsHoliday, row.Comments)
	}
	fmt.Println("-----------------------------------------------------------------------------------")
}

// addBridgeDays generates Extended day entries based on the provided holidays.
func addExtendedDays(original []Holiday) []Holiday {
	extendedHolidays := make([]Holiday, 0, len(original)*3)

	for _, row := range original {
		extendedHolidays = append(extendedHolidays, row)

		if row.Day == "Friday" && row.IsHoliday {
			// Add entries for the next two days (Saturday and Sunday)
			addExtendedDaysForDay(row, 1, 2, &extendedHolidays, &original)
		} else if row.Day == "Monday" && row.IsHoliday {
			// Add entries for the previous two days (Saturday and Sunday)
			addExtendedDaysForDay(row, -2, -1, &extendedHolidays, &original)
		}
	}

	return extendedHolidays
}

// addBridgeDaysForDay adds Extended day entries for the specified day.
func addExtendedDaysForDay(row Holiday, day1Offset, day2Offset int, holidays, original *[]Holiday) {
	nowDay := parseDateToTime(row.Date)

	date1 := nowDay.AddDate(0, 0, day1Offset).Format(targetDateFormat)
	date2 := nowDay.AddDate(0, 0, day2Offset).Format(targetDateFormat)

	// Check if the dates are not already in holidays
	if !isDateInTable(date1, *original) {
		addBridgeDayEntry("Saturday", date1, row.HolidayName, true, holidays)
	}
	if !isDateInTable(date2, *original) {
		addBridgeDayEntry("Sunday", date2, row.HolidayName, true, holidays)
	}
}

// isDateInHolidays checks if a given date is already in the holidays slice.
func isDateInTable(date string, holidays []Holiday) bool {
	for _, h := range holidays {
		if h.Date == date {
			return true
		}
	}
	return false
}

// parseDateToTime parses the date string to time.Time.
func parseDateToTime(dateStr string) time.Time {
	nowDay, err := time.Parse(targetDateFormat, dateStr)
	if err != nil {
		log.Printf(logFormat, "[ERROR]", fmt.Sprintf("Parse Date To Time: %s", err))
	}
	return nowDay
}

// addBridgeDayEntry adds a Extended day entry to the provided holidays slice.
func addBridgeDayEntry(day, date, hName string, isHoliday bool, holidays *[]Holiday) {
	bridgeDay := Holiday{
		Day:         day,
		Date:        date,
		HolidayName: "Extended Weekend",
		HolidayType: "Extended Weekend",
		IsHoliday:   isHoliday,
		Comments:    "Extended Weekend for " + hName,
	}
	*holidays = append(*holidays, bridgeDay)
}
