const filterObj = (obj: any, ...allowedFields: string[]) => {
  let filteredObj: any = {};
  Object.keys(obj).forEach((key: string) => {
    if (allowedFields.includes(key)) filteredObj[key] = obj[key];
  });

  return filteredObj;
};

export default filterObj;
