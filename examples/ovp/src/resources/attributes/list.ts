export const commaSeparatedListFormatter = {
  serialize: (items: Array<string>) => items.join(','),
  deserialize: (value: string) => value.split(',').map((item) => item.trim()),
}
