const successResponse = (data, res) => {
  const { statusCode = 200, message = "Success", data: payload, ...rest } = data;

  const response = {
    success: true,
    message: message,
    data: payload || null,
    ...rest,
  };

  res.status(statusCode).json(response);
};

export default successResponse;
