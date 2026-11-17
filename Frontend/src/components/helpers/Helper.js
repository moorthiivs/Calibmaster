export const formattedDate = (value) => {
  //  to convert Fri Oct 04 2024 00:00:00 GMT+0530 (India Standard Time) to '2024-10-04'
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
}