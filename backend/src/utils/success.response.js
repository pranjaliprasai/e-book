const successResponse = (data, res) => {
  const statusCode = data.statusCode || 200;
  const message = data.message || "Success";

  const response = {
    success: true,
    message: message,
    data: data.data || null,
  };

  res.status(statusCode).json(response);
};

export default successResponse;
