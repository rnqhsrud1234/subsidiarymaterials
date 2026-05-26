/**
 * user_input.html Supabase 패치
 * 
 * 사용 방법:
 * 1. user_input.html의 <head>에 다음 추가:
 *    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *    <script src="supabase-config.js"></script>
 * 
 * 2. 기존 saveData()와 loadData() 함수를 아래 함수로 교체
 */

/* 💾 Supabase에 데이터 저장 */
async function saveData(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  
  const userId = localStorage.getItem('userId');
  const branchId = localStorage.getItem('loginId');
  const branchName = localStorage.getItem('loginBranch');
  
  if (!userId || !branchId) {
    alert('로그인 정보가 없습니다.');
    return false;
  }

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = now.getMonth() + 1;

  const items = [];
  const rows = document.querySelectorAll('tbody tr');

  rows.forEach(row => {
    if (row.classList.contains('total')) return;

    const leftTd = row.querySelector('td.left');
    if (!leftTd) return;
    
    const itemName = leftTd.textContent.trim();
    if (!itemName) return;

    const item = { itemName: itemName };

    // 재고
    const stockInputs = row.querySelectorAll('input[data-field="stock"]');
    if (stockInputs.length > 0) {
      item.stock = Number(stockInputs[0].value || 0);
    }

    // 신청수량
    const applyInputs = row.querySelectorAll('input[data-field="apply"]');
    if (applyInputs.length > 0) {
      item.apply = Number(applyInputs[0].value || 0);
    }

    // PACK 재고
    const packStockInputs = row.querySelectorAll('input[data-field="packStock"]');
    if (packStockInputs.length > 0) {
      item.packStock = Number(packStockInputs[0].value || 0);
    }

    // PACK 신청
    const packApplyInputs = row.querySelectorAll('input[data-field="packApply"]');
    if (packApplyInputs.length > 0) {
      item.packApply = Number(packApplyInputs[0].value || 0);
    }

    items.push(item);
  });

  const payload = {
    user_id: userId,
    branch_id: branchId,
    branch_name: branchName || '',
    year: year,
    month: month,
    items: items
  };

  try {
    const { data, error } = await supabase
      .from('applications')
      .upsert(payload, {
        onConflict: 'branch_id,year,month'
      });

    if (error) throw error;

    console.log('✅ 저장 완료');
    console.log('저장된 항목 수:', items.length);
    alert('저장되었습니다. (총 ' + items.length + '개 항목)');
  } catch (error) {
    console.error('저장 오류:', error);
    alert('저장 중 오류가 발생했습니다: ' + error.message);
  }
  
  return false;
}

/* 🔄 Supabase에서 데이터 불러오기 */
async function loadData() {
  const userId = localStorage.getItem('userId');
  const branchId = localStorage.getItem('loginId');
  
  if (!userId || !branchId) return;

  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = now.getMonth() + 1;

  try {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('branch_id', branchId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('불러오기 오류:', error);
      return;
    }

    if (!data) {
      console.log('저장된 데이터 없음');
      return;
    }

    console.log('✅ 데이터 불러오기');
    console.log('항목 수:', data.items ? data.items.length : 0);

    if (!data.items || !Array.isArray(data.items)) return;

    // 각 항목별로 데이터 복원
    data.items.forEach(item => {
      const itemName = item.itemName;
      const row = findRowByItemName(itemName);
      if (!row) return;

      // 재고 복원
      if (item.stock != null) {
        const stockInputs = row.querySelectorAll('input[data-field="stock"]');
        if (stockInputs.length > 0) {
          stockInputs[0].value = item.stock;
        }
      }

      // 신청수량 복원
      if (item.apply != null) {
        const applyInputs = row.querySelectorAll('input[data-field="apply"]');
        if (applyInputs.length > 0) {
          applyInputs[0].value = item.apply;
        }
      }

      // PACK 재고 복원
      if (item.packStock != null) {
        const packStockInputs = row.querySelectorAll('input[data-field="packStock"]');
        if (packStockInputs.length > 0) {
          packStockInputs[0].value = item.packStock;
        }
      }

      // PACK 신청 복원
      if (item.packApply != null) {
        const packApplyInputs = row.querySelectorAll('input[data-field="packApply"]');
        if (packApplyInputs.length > 0) {
          packApplyInputs[0].value = item.packApply;
        }
      }
    });

    recalc();
  } catch (error) {
    console.error('불러오기 오류:', error);
  }
}

/* 로그아웃 함수도 업데이트 */
function logout() {
  localStorage.clear();
  location.href = 'login.html';
}
