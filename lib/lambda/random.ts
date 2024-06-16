exports.handler = async (event: any) => {
  const value = Math.random();  // Randomly decide success or failure
  return {
    value,
  };
};
