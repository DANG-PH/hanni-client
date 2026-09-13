# Tiêu đề trong giao diện Hanni

## Hai cấp dùng chung

- `PageHeading` trong `components/ui.tsx`: một `h1` cho đầu trang, có biểu tượng, nhãn ngữ cảnh, mô tả và vùng thao tác. Trên điện thoại, nút chuyển xuống dưới và có vùng chạm tối thiểu 44px.
- `SectionHeading`: `h2` cho đầu mục bên trong trang, biểu tượng nhỏ và đường phân cách. Truyền `id` khi section dùng `aria-labelledby`; truyền bộ lọc, số lượng hoặc liên kết qua `children`.

Cả hai dùng `components/headings.module.css` và màu theo theme hiện tại. `tone` hỗ trợ `primary`, `good`, `accent`, `lavender`; không cần tạo CSS riêng cho mỗi trang. Nhãn ngữ cảnh viết theo câu tự nhiên, giữ chữ viết tắt như HSK.

```tsx
<PageHeading
  icon="chart"
  tone="good"
  eyebrow="Hành trình của bạn"
  title="Tiến độ học tập"
  description="Nhìn lại những gì đã học và biết mình cần tập trung vào đâu."
>
  <LinkButton href="/study">Tiếp tục ôn tập</LinkButton>
</PageHeading>
```

Đã rà các route học tập, tài khoản, onboarding và xác thực. Các hero có minh họa, màn hình flashcard, kết quả có điểm số và tiêu đề video tiếp tục dùng bố cục riêng phù hợp với nội dung. Không áp style chung lên mọi thẻ `h1`/`h2`.

## Tham khảo thiết kế

- [GitHub Primer — PageHeader](https://primer.style/product/components/page-header/): tổ chức tiêu đề, mô tả, thao tác và thay đổi bố cục theo màn hình.
- [Mã nguồn Primer React trên GitHub](https://github.com/primer/react): tham khảo cách tách các thành phần trong hệ thống giao diện dùng lại.
- [Untitled UI — Figma page header components](https://www.untitledui.com/components/page-headers): tham khảo phân cấp chữ và khoảng cách trong bộ tiêu đề Figma.

Giao diện được viết bằng component, icon và token sẵn có của Hanni; không thêm thư viện UI.
