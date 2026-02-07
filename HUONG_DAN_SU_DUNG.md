# 🏟️ HỆ THỐNG ĐẶT LỊCH SÂN BÓNG - HƯỚNG DẪN SỬ DỤNG

## 📋 TỔNG QUAN HỆ THỐNG

Hệ thống đặt lịch và quản lý sân bóng với 3 vai trò chính:
- **ADMIN**: Quản lý toàn bộ hệ thống
- **STAFF**: Quản lý lịch sân được phân công
- **CUSTOMER**: Đặt và quản lý lịch đá bóng của mình

## 🔐 TÀI KHOẢN DEMO

Hệ thống có sẵn 3 tài khoản demo để trải nghiệm:

### Admin
- Email: `admin@football.com`
- Password: `password` (bất kỳ)

### Staff (Nhân viên)
- Email: `staff@football.com`
- Password: `password` (bất kỳ)

### Customer (Khách hàng)
- Email: `customer@football.com`
- Password: `password` (bất kỳ)

## 🎯 CHỨC NĂNG THEO VAI TRÒ

### 👑 ADMIN - Quản trị viên

#### Dashboard
- Xem tổng quan hệ thống: số sân, booking, trạng thái
- Danh sách booking gần đây
- Thống kê tổng hợp

#### Quản lý Sân Bóng
- Xem danh sách tất cả các sân (5/7/11 người)
- Thêm sân mới
- Chỉnh sửa thông tin sân
- Thay đổi trạng thái sân:
  - **Hoạt động**: Sân đang mở cho đặt lịch
  - **Bảo trì**: Tạm ngưng đặt lịch
  - **Ngưng hoạt động**: Đóng cửa hoàn toàn
- Quản lý bảng giá theo khung giờ (cao điểm/thấp điểm)

#### Quản lý Nhân viên
- Thêm/sửa thông tin nhân viên
- Phân công sân cho từng nhân viên
- Thiết lập lịch làm việc (ca làm việc theo ngày)

#### Quản lý Booking
- Xem tất cả booking trong hệ thống
- Lọc theo trạng thái:
  - Chờ xác nhận
  - Đã xác nhận
  - Hoàn thành
  - Đã hủy/Từ chối
- Xác nhận hoặc từ chối booking
- Tìm kiếm theo tên khách hàng hoặc sân

#### Thống kê & Báo cáo
- **Doanh thu**: Biểu đồ doanh thu theo tháng
- **Theo sân**: Thống kê booking và doanh thu từng sân
- **Trạng thái**: Phân bố các trạng thái booking (biểu đồ tròn)
- **Giờ cao điểm**: Phân tích khung giờ đông khách
- Tỷ lệ hủy lịch
- Giá trị trung bình mỗi booking

### 👔 STAFF - Nhân viên quản lý sân

#### Dashboard
- Xem booking hôm nay
- Danh sách booking chờ xử lý
- Số lượng sân được phân công

#### Quản lý Lịch
- Xem booking của các sân được phân công
- Xác nhận booking đang chờ
- Từ chối booking (với lý do)
- Lọc và tìm kiếm booking

**Lưu ý**: Staff chỉ xem/quản lý được các sân được phân công bởi Admin

### 👤 CUSTOMER - Khách hàng

#### Dashboard
- Xem lịch sắp tới
- Tổng số booking
- Số lượng booking đã hoàn thành

#### Đặt Sân
1. **Chọn sân**: Xem danh sách sân và chọn sân phù hợp
   - Sân 5 người: Nhỏ gọn, giá hợp lý
   - Sân 7 người: Trung bình
   - Sân 11 người: Sân chuẩn thi đấu

2. **Chọn ngày**: Chọn ngày muốn đá (không được chọn ngày quá khứ)

3. **Chọn giờ**: 
   - Giờ bắt đầu: Chỉ các mốc :00 hoặc :30
   - Thời lượng: 60/90/120 phút
   - Hệ thống hiển thị khung giờ nào đã được đặt

4. **Ghi chú**: Thêm yêu cầu đặc biệt (không bắt buộc)

5. **Xác nhận**: Xem tổng tiền và hoàn tất đặt sân

#### Lịch của Tôi
- **Sắp tới**: Các booking được xác nhận và chưa đá
- **Đã đá**: Lịch sử các lần đá bóng
- **Đã hủy**: Các booking bị hủy

#### Hủy Booking
- Có thể hủy MIỄN PHÍ nếu hủy trước **6 giờ**
- Không thể hủy nếu còn dưới 6 giờ đến giờ đá
- Phải ở trạng thái "Đã xác nhận" hoặc "Chờ xác nhận"

## 💰 HỆ THỐNG GIÁ

### Bảng Giá Mẫu

#### Sân A - 5 người
- 06:00 - 16:00: 300,000đ/giờ (Thấp điểm)
- 16:00 - 22:00: 500,000đ/giờ (Cao điểm)
- 22:00 - 24:00: 350,000đ/giờ (Tối muộn)

#### Sân B - 7 người
- 06:00 - 16:00: 500,000đ/giờ
- 16:00 - 22:00: 700,000đ/giờ
- 22:00 - 24:00: 550,000đ/giờ

#### Sân C - 11 người
- 06:00 - 16:00: 800,000đ/giờ
- 16:00 - 22:00: 1,200,000đ/giờ
- 22:00 - 24:00: 900,000đ/giờ

## 📱 TRẠNG THÁI BOOKING

1. **PENDING** (Chờ xác nhận): Booking mới tạo, chờ staff/admin xác nhận
2. **CONFIRMED** (Đã xác nhận): Staff đã xác nhận, sẵn sàng đá
3. **COMPLETED** (Hoàn thành): Đã đá xong
4. **CANCELLED** (Đã hủy): Khách hàng hủy
5. **REJECTED** (Từ chối): Staff/Admin từ chối

## ⚙️ BUSINESS RULES

### Đặt Lịch
- ✅ Chỉ đặt được sân đang HOẠT ĐỘNG
- ✅ Không được đặt trùng khung giờ
- ✅ Giờ bắt đầu phải là :00 hoặc :30
- ✅ Thời lượng: 60, 90 hoặc 120 phút
- ✅ Không được đặt giờ đã qua

### Hủy Lịch
- ✅ Khách hàng: Hủy trước 6 giờ → Miễn phí
- ❌ Khách hàng: Hủy dưới 6 giờ → Không được phép
- ✅ Staff/Admin: Có thể hủy bất kỳ lúc nào (với lý do)

### Phân Quyền
- ✅ Admin: Truy cập tất cả chức năng
- ✅ Staff: Chỉ quản lý sân được phân công
- ✅ Customer: Chỉ đặt sân và xem lịch của mình

## 🎨 TÍNH NĂNG NỔI BẬT

### 1. Dynamic Pricing (Giá linh hoạt)
- Giá thay đổi theo khung giờ
- Giờ cao điểm (16h-22h) đắt hơn
- Giờ thấp điểm (sáng sớm) rẻ hơn

### 2. Kiểm Tra Trùng Lịch
- Tự động kiểm tra booking trùng giờ
- Hiển thị khung giờ nào đã đặt
- Ngăn chặn đặt lịch conflict

### 3. Time Slot Management
- Chỉ cho phép đặt tại mốc :00 và :30
- Đảm bảo không có khoảng trống giữa các booking
- Tính toán chính xác giờ kết thúc

### 4. Thống Kê Chi Tiết
- Biểu đồ doanh thu theo tháng (Line Chart)
- So sánh doanh thu giữa các sân (Bar Chart)
- Phân bố trạng thái (Pie Chart)
- Phân tích giờ cao điểm

### 5. Responsive Design
- Hoạt động tốt trên desktop
- Tối ưu cho tablet
- Menu responsive cho mobile

### 6. Real-time Feedback
- Toast notifications cho mọi hành động
- Thông báo lỗi rõ ràng
- Xác nhận trước khi thực hiện hành động quan trọng

## 🚀 CÁC TÍNH NĂNG CÓ THỂ MỞ RỘNG

1. **Thanh toán Online**: Tích hợp VNPay, MoMo
2. **Thông báo**: Email/SMS khi booking được xác nhận
3. **Đặt lịch định kỳ**: Đặt cố định mỗi tuần
4. **Giữ chỗ tạm thời**: Hold slot 5-10 phút
5. **Check-in QR Code**: Quét mã khi đến sân
6. **Đánh giá**: Khách hàng đánh giá sau khi đá
7. **Loyalty Program**: Tích điểm, giảm giá cho khách quen
8. **Weather Integration**: Cảnh báo thời tiết xấu
9. **Calendar Sync**: Đồng bộ với Google Calendar
10. **Multi-language**: Hỗ trợ nhiều ngôn ngữ

## 📞 HỖ TRỢ

Nếu gặp vấn đề khi sử dụng hệ thống, vui lòng liên hệ:
- Hotline: 1900-xxxx
- Email: support@footballbooking.com

---

**Phiên bản**: 1.0.0  
**Ngày cập nhật**: 07/02/2026
