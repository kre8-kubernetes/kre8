export const isBool = (val) => typeof val === 'boolean';

export const getNested = (obj, ...args) => {
  return args.reduce((obj, level) => { 
    return obj && obj[level];
  }, obj);
};
