# Tài liệu Build

## Cách lấy địa chỉ của Channel

### 1. Tổng quan
Địa chỉ cửa hàng được lưu trữ trong customFields của activeChannel trong Vendure CMS. Khi người dùng chọn phương thức "Nhận tại cửa hàng" (pickup), địa chỉ này sẽ được hiển thị.

### 2. Quy trình lấy địa chỉ

1. Khi component CheckoutPage được mount, một useEffect hook sẽ chạy và gọi hàm `fetchStoreAddress()`

2. Hàm `fetchStoreAddress()` thực hiện một GraphQL query để lấy thông tin từ `activeChannel`:
   ```graphql
   query {
     activeChannel {
       id
       code
       token
       customFields {
         storeAddress
       }
     }
   }
   ```

3. Query được gửi đến API endpoint với các thông số:
   - Method: POST
   - Headers: 
     - Content-Type: application/json
     - vendure-token: [token]
   - Body: GraphQL query

4. Xử lý response:
   - Nếu có lỗi: set error state
   - Nếu thành công: lấy địa chỉ từ `data.activeChannel.customFields.storeAddress` và set vào `storeAddress` state

### 3. Sử dụng địa chỉ
- Địa chỉ được sử dụng khi người dùng chọn phương thức "Nhận tại cửa hàng"
- Địa chỉ được hiển thị trong một div với class `bg-gray-50 rounded-lg`
- Khi chọn phương thức pickup, địa chỉ này sẽ được tự động điền vào form địa chỉ giao hàng

### 4. Lưu ý
- Cần đảm bảo `NEXT_PUBLIC_SHOP_API_URL` và `NEXT_PUBLIC_VENDURE_TOKEN` được cấu hình đúng trong môi trường
- Địa chỉ cửa hàng phải được cấu hình trong customFields của channel trong Vendure CMS
- Có xử lý cleanup khi component unmount để tránh memory leak 