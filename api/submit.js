// api/submit.js
export default async function handler(req, res) {
  // Basic CORS handling (optional but safe)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return res.status(500).json({
      error:
        "Telegram environment variables are not set. Please define TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in Vercel."
    });
  }

  try:
    const body =
      typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    const {
      studentName,
      studentSurname,
      studentGroup,
      loginTime,
      quizType,
      articleId,
      isGeneralTest,
      generalLevel,
      score,
      total,
      percentage,
      timestamp,
      questions
    } = body;

    const headerLine = isGeneralTest
      ? `🧠 GENERAL TEST – Level: ${generalLevel || "Unknown"}`
      : `📖 ARTICLE TEST – Article ${articleId || "?"}`;

    const studentLine = `👤 Student: ${studentName || "?"} ${studentSurname || "?"}\n👥 Group: ${
      studentGroup || "?"
    }`;
    const timeLine = `⏰ Login Time: ${loginTime || "?"}\n📝 Quiz Time: ${timestamp || "?"}`;
    const scoreLine = `✅ Score: ${score}/${total} (${Math.round(percentage || 0)}%)`;
    const typeLine = `🧩 Quiz Type: ${quizType || (isGeneralTest ? "General" : "Unknown")}`;

    let questionLines = "";
    if (Array.isArray(questions)) {
      questionLines =
        questions
          .map((q, index) => {
            const qText = q.question || q.prompt || "";
            const userAns = q.userAnswer ?? "";
            const correctAns = q.correctAnswer ?? "";
            const isCorrect = q.isCorrect ? "✅" : "❌";
            return (
              `${index + 1}) ${qText}\n` +
              `   Your answer: ${userAns}\n` +
              `   Correct answer: ${correctAns} ${isCorrect}`
            );
          })
          .join("\n\n") || "";
    }

    const message =
      `${headerLine}\n\n` +
      `${studentLine}\n` +
      `${timeLine}\n\n` +
      `${typeLine}\n${scoreLine}\n\n` +
      (questionLines ? `📋 Details:\n\n${questionLines}` : "No question details.");

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telegram API error:", errorText);
      return res.status(500).json({ error: "Failed to send message to Telegram" });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in /api/submit:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
