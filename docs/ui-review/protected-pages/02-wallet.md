# Trang My Wallet (Protected)

**URL:** https://skillverse.vn/my-wallet  
**File:** `src/pages/my-wallet/MyWalletCosmic.tsx`

---

## ✅ Điểm tốt

1. **"Ví Vũ Trụ"** theme phù hợp
2. **Hiển thị 2 loại tài sản**: VND Cash và SkillCoin
3. **Cosmic background**: Stars animation
4. **5 tabs**: Overview, Transactions, Store, Withdrawals, Settings
5. **Multiple modals**: Deposit, Buy Coin, Withdraw, Bank Setup

---

## 📊 Dữ liệu thực từ API (User ID: 6)

| Field | Value |
|-------|-------|
| Cash Balance | 261,000 VND |
| Coin Balance | 5,910 xu |
| Status | ACTIVE |
| Premium | Mentor Pro (còn 9 ngày) |

---

## ⚠️ Vấn đề cần cải thiện

| # | Vấn đề | Vị trí UI | File Code | Đề xuất |
|---|--------|-----------|-----------|---------|
| 21.1 | **Store items hardcoded** 🔴 | Tab Store | `MyWalletCosmic.tsx:122-179` | Fetch từ API |
| 21.2 | **COIN_TO_VND_RATE = 76** hardcoded | Total assets | `MyWalletCosmic.tsx:300` | Fetch từ config |
| 21.3 | **"Tính năng đang phát triển"** | Store purchase | `MyWalletCosmic.tsx:282-285` | Implement hoặc ẩn |
| 21.4 | **PaymentCallbackHelper** | Callback | `MyWalletCosmic.tsx:250` | Verify production |
| 21.5 | **No loading state** modals | Modals | Components | Thêm loading |
| 21.6 | **Invoice download** limited types | Transactions | `MyWalletCosmic.tsx:368-369` | Clarify UI |

---

## 💡 Code Fix

### Fix 21.1: Fetch Store Items

```tsx
// src/pages/my-wallet/MyWalletCosmic.tsx
const [storeItems, setStoreItems] = useState<StoreItem[]>([]);

useEffect(() => {
  const fetchStoreItems = async () => {
    try {
      const items = await walletService.getStoreItems();
      setStoreItems(items);
    } catch (error) {
      console.error('Failed to fetch store items:', error);
    }
  };
  fetchStoreItems();
}, []);
```

### Auto-renewal Warning

```tsx
{subscription && !subscription.autoRenew && subscription.daysRemaining <= 7 && (
  <div className="renewal-warning">
    <AlertCircle size={16} />
    <span>
      Gói Premium sẽ hết hạn trong {subscription.daysRemaining} ngày.
      <button onClick={() => setShowEnableAutoRenewalModal(true)}>
        Bật gia hạn tự động
      </button>
    </span>
  </div>
)}
```

---

## Wallet Modals

| Modal | File | Issues |
|-------|------|--------|
| DepositCashModal | `wallet/DepositCashModal.tsx` | Verify min amount |
| BuyCoinModal | `wallet/BuyCoinModal.tsx` | Verify pricing |
| WithdrawModal | `wallet/WithdrawModal.tsx` | Bank required check |
| SetupBankAccountModal | `wallet/SetupBankAccountModal.tsx` | OK |
