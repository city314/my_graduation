// Worker chỉ chạy cho trang chủ "/" (xem run_worker_first trong wrangler.jsonc).
// Có ?to=Tên (và/hoặc ?xh=chi...) thì chèn tên + xưng hô vào HTML ngay trên server,
// để Zalo / Messenger (vốn không chạy JavaScript) hiện ảnh xem trước
// "Chị Thảo ơi, mời chị dự…". Ảnh, CSS, JS... vẫn do Cloudflare trả thẳng.

// Bảng xưng hô dùng chung với trang thiệp (gắn vào globalThis.XungHo)
import "../public/js/xung-ho.js";

const { XungHo } = globalThis;

export default {
  async fetch(request, env) {
    const page = await env.ASSETS.fetch(request);

    const url = new URL(request.url);
    const params = url.searchParams;
    if (
      !(params.get("to") || params.get("xh")) ||
      !page.headers.get("content-type")?.includes("text/html")
    ) {
      return page;
    }

    const guest = XungHo.resolve(params);
    const title = XungHo.title(guest);

    // Link riêng của từng người. og:url phải là link này, nếu để link gốc thì
    // Facebook / Zalo sẽ đọc lại trang gốc và hiện "Mời bạn…" chung.
    const own = new URLSearchParams();
    if (guest.name) own.set("to", guest.name);
    if (params.get("xh") === guest.key) own.set("xh", guest.key);
    const ownUrl = `${url.origin}/?${own.toString().replace(/\+/g, "%20")}`;

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
        element: (el) =>
          el.setInnerContent(`Gửi ${guest.inText || guest.you} thân mến,`),
      })
      .on("#guestName", {
        element: (el) =>
          el.setInnerContent(guest.name || XungHo.cap(guest.you)),
      })
      .on("[data-xh]", {
        element: (el) =>
          el.setInnerContent(
            XungHo.fill(`{${el.getAttribute("data-xh")}}`, guest),
          ),
      })
      .transform(page);

    // Mỗi người một trang khác nhau → không để trình duyệt/CDN dùng chung bản cache
    const res = new Response(html.body, html);
    res.headers.set("Cache-Control", "no-cache");
    res.headers.delete("ETag");
    return res;
  },
};
