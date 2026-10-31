"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ fontFamily: "Tahoma, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, background: "#f7faf5", color: "#173225" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <h1>تعذّر تحميل المنصة</h1>
          <p>حدث خطأ غير متوقع. حاول مرة أخرى بعد قليل.</p>
          <button onClick={reset} style={{ padding: "10px 20px", borderRadius: 8, border: 0, background: "#166534", color: "#fff", cursor: "pointer" }}>
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
