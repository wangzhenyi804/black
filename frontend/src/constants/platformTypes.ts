export const PLATFORM_TYPE_OPTIONS = [
  { value: '360', label: '360' },
  { value: 'baidu', label: '百度' },
  { value: 'google', label: 'Google' },
  { value: 'sm', label: '神马' },
];

export const PLATFORM_TYPE_FILTER_OPTIONS = [
  { value: '全部', label: '全部平台' },
  ...PLATFORM_TYPE_OPTIONS,
];

export const getPlatformTypeLabel = (value?: string | null) => {
  if (!value) return '-';
  return PLATFORM_TYPE_OPTIONS.find(option => option.value === value)?.label || value;
};
