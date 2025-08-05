document.addEventListener("DOMContentLoaded", () => {
  const app = {
    //-----進度條----
    initProgressBar() {
        const container = document.getElementById('progressContainer');
        const bar = document.getElementById('progressBar');
        if (container && bar) {
          bar.style.width = '5%';
          container.style.display = 'block';
        }
      },

      simulateProgressAdvance() {
        const bar = document.getElementById('progressBar');
        if (!bar) return;

        let progress = 5;
        bar.simulatedTimer = setInterval(() => {
          if (progress < 90) {
            progress += Math.random() * 3;
            bar.style.width = `${progress}%`;
          }
        }, 200);
      },

      finishProgressBar() {
        const bar = document.getElementById('progressBar');
        const container = document.getElementById('progressContainer');
        if (bar && container) {
          clearInterval(bar.simulatedTimer);
          bar.style.width = '100%';
          setTimeout(() => {
            container.style.display = 'none';
            bar.style.width = '0%';
          }, 500);
        }
      },
    //-----進度條收尾---
    customerData: [],
    selectedCustomers: new Set(),

    init() {
      this.renderLayout();
      this.injectPrintStyles();
      this.loadCSS();
      this.bindEvents();
      this.fetchCustomers();
    },

    renderLayout() {
      document.body.innerHTML = `
        <nav class="menu"><ul><li><a href="#">巨興化學儀器有限公司 對帳單列印</a></li></ul></nav>
        <div class="page">
          <div id="filters">
            <label>開始日期：<input type="date" id="start-date"></label>
            <label>結束日期：<input type="date" id="end-date"></label>
            <label>客戶搜尋：<input type="text" id="customer-search" placeholder="輸入編號或名稱"></label>
            <label><input type="checkbox" id="select-all-customers"> 全選</label>
            <div id="customer-options" style="max-height:120px; overflow:auto; border:1px solid #ccc; padding:4px; margin:4px 0;"></div>
            <button id="generate-btn">產生對帳單</button>
          </div>
          <div id="reportContainer"></div>
        </div>`;
    },

    injectPrintStyles() {
      const printStyle = document.createElement('style');
      printStyle.media = 'print';
      printStyle.innerHTML = `
        @page {
          size: A4 portrait;
          margin: 10mm;
          @bottom-center {
            content: "第 " counter(page) " 頁, 共 " counter(pages) " 頁";
          }
        }
        body {
          margin: 0;
          padding: 0;
          counter-reset: page;
        }
        .page {
          counter-reset: page; /* 每個客戶重置頁碼 */
          page-break-after: always;
          padding: 10mm;
          box-sizing: border-box;
        }
        /* 確保備註在列印時顯示 */
        .page footer {
          display: block !important;
          position: relative;
          margin-top: 10mm;
        }
        #filters, nav.menu { display: none !important; }
      `;
      document.head.appendChild(printStyle);
    },

    loadCSS() {
      const style = document.createElement('style');
      fetch('/static/css/getAcc.css')
        .then(res => res.text())
        .then(css => {
          style.innerHTML = css;
          document.head.appendChild(style);
        });
    },

    bindEvents() {
      document.getElementById('customer-search')
        .addEventListener('input', e => this.renderCustomerOptions(e.target.value.trim()));

      document.getElementById('generate-btn')
        .addEventListener('click', () => {
          const d1 = document.getElementById('start-date').value;
          const d2 = document.getElementById('end-date').value;
          if (!d1 || !d2 || this.selectedCustomers.size === 0) {
            alert("請選擇日期與客戶");
            return;
          }
          this.fetchAndRenderReport([...this.selectedCustomers], d1, d2);
        });

      document.getElementById('select-all-customers')
        .addEventListener('change', e => {
          const checked = e.target.checked;
          document.querySelectorAll('#customer-options input[type="checkbox"]').forEach(chk => {
            chk.checked = checked;
            if (checked) this.selectedCustomers.add(chk.value);
            else this.selectedCustomers.delete(chk.value);
          });
        });
    },

    fetchCustomers() {

      fetch('/getCust/')
        .then(res => {
          if (!res.ok) throw new Error('伺服器回傳失敗');
          return res.json();
        })
        .then(list => {
          // 只要 list 不是 array，就改回空陣列
          this.customerData = Array.isArray(list) ? list : [];
          console.log('Fetched customers:', this.customerData);
          this.renderCustomerOptions('');
        })
        .catch(err => {
          console.error('載入客戶清單失敗：', err);
          this.customerData = [];
          // optional: 顯示 UI 提示使用者無法取得名單
        });
    },

    /*
    renderCustomerOptions(searchTerm) {
      const container = document.getElementById('customer-options');

      container.innerHTML = '';
      const key = searchTerm.toLowerCase();
      this.customerData.forEach(c => {
        if (!searchTerm || c.Cusno.toLowerCase().includes(key) || c.Name.toLowerCase().includes(key)) {
          const id = `cust-${c.Cusno}`;
          const chk = this.selectedCustomers.has(c.Cusno) ? 'checked' : '';
          const label = document.createElement('label');
          label.style.display = 'block';
          label.innerHTML = `<input type="checkbox" id="${id}" value="${c.Cusno}" ${chk}> ${c.Cusno} - ${c.Name}`;
          container.appendChild(label);
          label.querySelector('input').addEventListener('change', e => {
            if (e.target.checked) this.selectedCustomers.add(e.target.value);
            else this.selectedCustomers.delete(e.target.value);
          });
        }
      });
    },
    */

    renderCustomerOptions(searchTerm) {
      const container = document.getElementById('customer-options');
      container.innerHTML = '';              // 清空原有選項
      const key = searchTerm.toLowerCase();

      // 如果 this.customerData 是 null 或 undefined，就無法執行 forEach
      this.customerData.forEach(c => {
        // 篩選符合 Cusno 或 Name 的項目
        if (
          !searchTerm ||
          c.Cusno.toLowerCase().includes(key) ||
          c.Name.toLowerCase().includes(key)
        ) {
          const id = `cust-${c.Cusno}`;
          const chk = this.selectedCustomers.has(c.Cusno) ? 'checked' : '';
          const label = document.createElement('label');
          label.style.display = 'block';
          label.innerHTML = `<input type="checkbox" id="${id}" value="${c.Cusno}" ${chk}> ${c.Cusno} - ${c.Name}`;
          container.appendChild(label);

          // 為每個 checkbox 綁定變更事件
          label
            .querySelector('input')
            .addEventListener('change', e => {
              if (e.target.checked) this.selectedCustomers.add(e.target.value);
              else this.selectedCustomers.delete(e.target.value);
            });
        }
      });
    },

    async fetchAndRenderReport(cusnos, d1, d2) {
      this.initProgressBar();              // 顯示並初始化進度條
      this.simulateProgressAdvance();      // 模擬進度緩慢前進

      console.log('啟動對帳單查詢：', cusnos, d1, d2);

      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cusnos, startDate: d1, endDate: d2 })
      });
      if (!res.ok) {
        alert('伺服器查詢失敗');
        this.finishProgressBar();         // <== 加這行讓進度條收尾
        return;
      }

      const data = await res.json();
      console.log('後端回傳資料：', data);

      const container = document.getElementById('reportContainer');
      container.innerHTML = '';

      data.forEach(item => {
        const sales = Array.isArray(item.Sales) ? item.Sales : [];
        const inv = Array.isArray(item.Inv) ? item.Inv : [];
        const notRec = Array.isArray(item.NotRec) ? item.NotRec : [];
        const beforeAmt = Array.isArray(item.BeforeAmt) ? item.BeforeAmt : [];
        const cusno = item.Cusno;

        sales.sort((a, b) => (a.Psno || '').localeCompare(b.Psno || ''));
        inv.sort((a, b) => (a.Invno || '').localeCompare(b.Invno || ''));
        notRec.sort((a, b) => (a.Invno || '').localeCompare(b.Invno || ''));

        const page = document.createElement('div'); page.classList.add('page');
        const header = document.createElement('header');
        const cname = this.getCustomerName(cusno);
        const now = new Date();
        const rocYear = now.getFullYear() - 1911;
        const mmDate = String(now.getMonth()+1).padStart(2,'0');
        const ddDate = String(now.getDate()).padStart(2,'0');
        const hh = String(now.getHours()).padStart(2,'0');
        const min = String(now.getMinutes()).padStart(2,'0');
        const ss = String(now.getSeconds()).padStart(2,'0');
        const formattedDateTime = `${rocYear}/${mmDate}/${ddDate} ${hh}:${min}:${ss}`;
        header.innerHTML = `
          <h1>巨興化學儀器有限公司</h1>
          <h2>對帳單</h2>
          <p><strong>客戶代碼：${cusno}</strong> ${cname}</p>
          <p>期間：${d1} 至 ${d2}</p>
          <p>製表日期：${formattedDateTime}</p>
        `;
        page.appendChild(header);

        const b0 = beforeAmt[0]?.Balance || 0;
        const sumInv = inv.reduce((s, r) => s + (r.InvAmt || 0), 0);
        const sumSales = sales.reduce((s, r) => s + (r.Amt || 0), 0);
        const finalBal = b0 + sumInv - sumSales;
        const summary = document.createElement('section');
        summary.innerHTML = `
          <h2>結算摘要</h2>
          <table>
            <tr><th>期初餘額</th><td style="text-align:right">${b0.toLocaleString('zh-TW')}</td></tr>
            <tr><th>發票合計</th><td style="text-align:right">${sumInv.toLocaleString('zh-TW')}</td></tr>
            <tr><th>銷貨合計</th><td style="text-align:right">${sumSales.toLocaleString('zh-TW')}</td></tr>
            <tr><th>結餘</th><td style="text-align:right">${finalBal.toLocaleString('zh-TW')}</td></tr>
          </table>
        `;
        page.appendChild(summary);

        if (sales.length) page.appendChild(this.renderTableWithSubtotal('銷貨明細', sales, [
          { key:'Ardd',   label:'銷貨日期'  },
          { key:'Psno',   label:'銷貨單號'  },
          { key:'Trem',   label:'出貨名稱'  },
          { key:'Qty',    label:'數量'      },
          { key:'Ut',     label:'單位'      },
          { key:'Up',     label:'單價'      },
          { key:'Amt_net',label:'未稅金額' },
          { key:'Tax',    label:'稅額'      },
          { key:'Amt',    label:'含稅金額' }
        ], 'Amt'));

        if (inv.length) page.appendChild(this.renderTableWithSubtotal('發票明細', inv, [
          { key:'Invdd',  label:'發票日期' },
          { key:'Invno',  label:'發票號碼' },
          { key:'Anet',   label:'未稅金額' },
          { key:'Tax',    label:'稅額'      },
          { key:'InvAmt', label:'含稅金額' }
        ], 'InvAmt'));

        if (notRec.length) page.appendChild(this.renderTableWithSubtotal('未收款發票', notRec, [
          { key:'Invdd',  label:'發票日期' },
          { key:'Invno',  label:'發票號碼' },
          { key:'Amt',    label:'開立金額' },
          { key:'Balance',label:'未收金額' }
        ], 'Balance'));

        const footerNote = document.createElement('footer');
        footerNote.style.marginTop = '10mm';
        footerNote.innerHTML = `
          <p>備註：貨款未全部兌現前，依動產法第三章規定，貨物所有權仍歸賣方所有，買方不得異議。</p>
        `;
        page.appendChild(footerNote);

        const signSection = document.createElement('div');
        signSection.style.marginTop = '10mm';
        signSection.innerHTML = `<p>客戶確認簽章：____________________________</p>`;
        page.appendChild(signSection);

        container.appendChild(page);
        
        this.finishProgressBar();           // <== 畫面渲染完成，進度條收尾
      });
    },

    renderTableWithSubtotal(title, data, cols, sumField) {
      const sec = document.createElement('section');
      sec.innerHTML = `<h2>${title}</h2>`;
      const tbl = document.createElement('table');

      const thead = document.createElement('thead');
      thead.innerHTML = '<tr>' + cols.map(c => `<th>${c.label}</th>`).join('') + '</tr>';
      tbl.appendChild(thead);

      const tbody = document.createElement('tbody');
      let sub = 0;
      data.forEach(r => {
        const tr = document.createElement('tr');
        cols.forEach(c => {
          const val = this.formatCell(r[c.key]);
          const isNum = typeof r[c.key] === 'number';
          tr.innerHTML += `<td${isNum ? ' style=\"text-align:right\"' : ''}>${val}</td>`;
        });
        tbody.appendChild(tr);
        sub += r[sumField] || 0;
      });
      const tot = document.createElement('tr');
      tot.className = 'total';
      tot.innerHTML = `<td colspan=\"${cols.length - 1}\">小計</td><td style=\"text-align:right\">${sub.toLocaleString('zh-TW')}</td>`;
      tbody.appendChild(tot);

      tbl.appendChild(tbody);
      sec.appendChild(tbl);
      return sec;
    },

    getCustomerName(cusno) {
      const cust = this.customerData.find(c => c.Cusno === cusno);
      return cust ? cust.Name : '';
    },

    formatCell(v) {
      if (v == null) return '';
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) {
        const d = new Date(v);
        const y = d.getFullYear() - 1911;
        const m = String(d.getMonth()+1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}/${m}/${day}`;
      }
      if (typeof v === 'number')
        return v.toLocaleString('zh-TW', { minimumFractionDigits: 0 });
      return v;
    }
  };

  app.init();
});
