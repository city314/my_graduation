// Worker chỉ chạy cho trang chủ "/" (xem run_worker_first trong wrangler.jsonc).
// Có ?to=Tên thì chèn tên vào HTML ngay trên server, để Zalo / Messenger
// (vốn không chạy JavaScript) hiện ảnh xem trước "Minh ơi, mời bạn dự…".
// Ảnh, CSS, JS... vẫn do Cloudflare trả thẳng, không đi qua Worker.

export default {
  async fetch(request, env) {
    const page = await env.ASSETS.fetch(request);

    const url = new URL(request.url);
    // Giống main.js: bỏ khoảng trắng thừa, tối đa 40 ký tự
    const guest = (url.searchParams.get("to") || "").trim().slice(0, 40);
    if (!guest || !page.headers.get("content-type")?.includes("text/html")) {
      return page;
    }

    // Link riêng của từng người. og:url phải là link này, nếu để link gốc thì
    // Facebook / Zalo sẽ đọc lại trang gốc và hiện "Mời bạn…" chung.
    const ownUrl = `${url.origin}/?to=${encodeURIComponent(guest)}`;
    const title = `${guest} ơi, mời bạn dự Lễ tốt nghiệp của Công Tuấn!`;

    // HTMLRewriter tự escape nội dung, nên tên chứa < > " cũng không chèn được mã
    const html = new HTMLRewriter()
      .on("title", { element: (el) => el.setInnerContent(title) })
      .on('meta[property="og:title"]', {
        element: (el) => el.setAttribute("content", `🎓 ${title}`),
      })
      .on('meta[property="og:url"]', {
        element: (el) => el.setAttribute("content", ownUrl),
      })
      .on('link[rel="canonical"]', {
        element: (el) => el.setAttribute("href", ownUrl),
      })
      .on("#greeting", {
        element: (el) => el.setInnerContent(`Gửi ${guest} thân mến,`),
      })
      .on("#guestName", { element: (el) => el.setInnerContent(guest) })
      .transform(page);

    // Mỗi tên một trang khác nhau → không để trình duyệt/CDN dùng chung bản cache
    const res = new Response(html.body, html);
    res.headers.set("Cache-Control", "no-cache");
    res.headers.delete("ETag");
    return res;
  },
};
