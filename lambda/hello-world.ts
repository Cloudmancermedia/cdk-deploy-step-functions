exports.handler = async (event: any) => {
  console.log("Hello, World!");
  const success = Math.random() > 0.5;  // Randomly decide success or failure
  return {
    success,
  };
};
