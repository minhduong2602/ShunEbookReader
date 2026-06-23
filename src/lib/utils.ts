export const formatChapterName = (name: string) => {
  if (name.length > 35) {
    return name.substring(0, 20) + '...' + name.substring(name.length - 15);
  }
  return name;
};
