/* =========================================================
   Xưng hô theo người được mời
   Dùng chung cho: trang thiệp (main.js), Worker (src/index.js)
   và công cụ tạo link (tools/tao-link.html).

   - ?to=Chị Thảo        → tự nhận ra "chị": gọi khách "chị", Tuấn xưng "em"
   - ?to=Anh Thư&xh=ban  → chọn tay khi đoán sai (bạn tên "Anh Thư")
   Trong câu chữ dùng {ban} {Ban} {tui} {Tui}, sẽ được thay theo người nhận.
   ========================================================= */
(function (root) {
  // you: cách gọi khách · me: Công Tuấn tự xưng
  const ROLES = {
    ban: { label: "Bạn bè", you: "bạn", me: "tui" },
    anh: { label: "Anh", you: "anh", me: "em" },
    chi: { label: "Chị", you: "chị", me: "em" },
    em: { label: "Em", you: "em", me: "anh" },
    thay: { label: "Thầy", you: "thầy", me: "em" },
    co: { label: "Cô (giáo)", you: "cô", me: "em" },
    cohh: { label: "Cô (họ hàng)", you: "cô", me: "cháu" },
    chu: { label: "Chú", you: "chú", me: "cháu" },
    bac: { label: "Bác", you: "bác", me: "cháu" },
    di: { label: "Dì", you: "dì", me: "cháu" },
    cau: { label: "Cậu", you: "cậu", me: "cháu" },
    ong: { label: "Ông", you: "ông", me: "cháu" },
    ba: { label: "Bà", you: "bà", me: "cháu" },
  };

  // Chữ đầu của tên → kiểu xưng hô
  const PREFIX = {
    anh: "anh", "chị": "chi", em: "em", "thầy": "thay", "cô": "co",
    "chú": "chu", "bác": "bac", "dì": "di", "cậu": "cau", "ông": "ong", "bà": "ba",
  };

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // Bỏ khoảng trắng thừa, tối đa 40 ký tự; NFC để "ị" gõ kiểu tổ hợp vẫn nhận ra
  function cleanName(raw) {
    return String(raw || "").normalize("NFC").replace(/\s+/g, " ").trim().slice(0, 40);
  }

  // Chỉ đoán khi tên có từ 2 chữ: "Anh" một mình là tên người, "Anh Tú" là anh Tú
  function detect(name) {
    const words = cleanName(name).split(" ");
    return (words.length > 1 && PREFIX[words[0].toLowerCase()]) || "ban";
  }

  // Lấy tên + xưng hô từ link (URLSearchParams)
  function resolve(params) {
    const name = cleanName(params.get("to"));
    const picked = params.get("xh");
    const key = ROLES[picked] ? picked : detect(name);
    const { you, me } = ROLES[key];
    // Trong câu viết thường chữ xưng hô: "Gửi chị Thảo", trên thiệp giữ như gõ: "Chị Thảo".
    // Chữ đầu là tên riêng (bạn "Anh Thư" chọn xưng hô bạn bè) thì giữ nguyên.
    const words = name.split(" ");
    const first = words[0].toLowerCase();
    const inText = words.length > 1 && first === you
      ? [first, ...words.slice(1)].join(" ")
      : name;
    return { name, inText, key, you, me };
  }

  // Thay {ban} {Ban} {tui} {Tui} trong câu
  function fill(text, r) {
    return text
      .replaceAll("{ban}", r.you).replaceAll("{Ban}", cap(r.you))
      .replaceAll("{tui}", r.me).replaceAll("{Tui}", cap(r.me));
  }

  // Tiêu đề tab / ảnh xem trước
  function title(r) {
    return r.name
      ? `${cap(r.inText)} ơi, mời ${r.you} dự Lễ tốt nghiệp của Công Tuấn!`
      : `Mời ${r.you} dự Lễ tốt nghiệp của Công Tuấn!`;
  }

  root.XungHo = { ROLES, cap, cleanName, detect, resolve, fill, title };
})(globalThis);
