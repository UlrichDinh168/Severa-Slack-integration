export const displayDate = async ({ event, say }) => {
  const today = new Date();
  console.log(today);
  try {
    await say({
      text: `:wave: <@${event.user}>, today is ${today.toLocaleString()}`,
    });
  } catch (error) {
    console.error("error", error);
  }
};

export const greeting = async ({ event, say }) => {
  await say({
    text: `:wave: <@${event.user}>, is there anything I can help you with? :hugging_face:`,
  });
};
