import { HassEntities, HassEntity } from 'home-assistant-js-websocket';
import { compress as lzStringCompress, decompress as lzStringDecompress } from 'lz-string';
import { ChartCardConfig, EntityCachePoints } from './types';
import { TinyColor } from '@ctrl/tinycolor';
import parse from 'parse-duration';
import { ChartCardPrettyTime } from './types-config';
import { DEFAULT_MAX, DEFAULT_MIN, moment, NO_VALUE } from './const';

export function compress(data: unknown): string {
  return lzStringCompress(JSON.stringify(data));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decompress(data: unknown | undefined): any | undefined {
  if (data !== undefined && typeof data === 'string') {
    const dec = lzStringDecompress(data);
    return dec && JSON.parse(dec);
  }
  return data;
}

export function getMilli(hours: number): number {
  return hours * 60 ** 2 * 10 ** 3;
}

export function log(message: unknown): void {
  // eslint-disable-next-line no-console
  console.warn('apexcharts-card: ', message);
}

/**
 * Performs a deep merge of `source` into `target`.
 * Mutates `target` only but not its objects and arrays.
 *
 * @author inspired by [jhildenbiddle](https://stackoverflow.com/a/48218209).
 */
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types, @typescript-eslint/no-explicit-any
export function mergeDeep(target: any, source: any): any {
  const isObject = (obj) => obj && typeof obj === 'object';

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach((key) => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      target[key] = targetValue.concat(sourceValue);
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = mergeDeep(Object.assign({}, targetValue), sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
}

export function computeName(
  index: number,
  config: ChartCardConfig | undefined,
  entities: (HassEntity | undefined)[] | HassEntities | undefined = undefined,
  entity: HassEntity | undefined = undefined,
): string {
  if (!config || (!entities && !entity)) return '';
  let name = '';
  if (entity) {
    name = config.series[index].name || entity.attributes?.friendly_name || entity.entity_id || '';
  } else if (entities) {
    name =
      config.series[index].name ||
      entities[index]?.attributes?.friendly_name ||
      entities[entities[index]]?.entity_id ||
      '';
  }
  return name + (config.series[index].offset ? ` (${config.series[index].offset})` : '');
}

export function computeUom(
  index: number,
  config: ChartCardConfig | undefined,
  entities: HassEntity[] | undefined[] | undefined = undefined,
  entity: HassEntity | undefined = undefined,
): string {
  if (!config || (!entities && !entity)) return '';
  if (entity) {
    return config.series[index].unit || entity.attributes?.unit_of_measurement || '';
  } else if (entities) {
    return config.series[index].unit || entities[index]?.attributes?.unit_of_measurement || '';
  }
  return '';
}

export function computeColors(colors: string[] | undefined): string[] {
  if (!colors) return [];
  return colors.map((color) => {
    return computeColor(color);
  });
}

export function computeColor(color: string): string {
  if (color[0] === '#') {
    return color;
  } else if (color.substring(0, 3) === 'var') {
    return new TinyColor(
      window.getComputedStyle(document.documentElement).getPropertyValue(color.substring(4).slice(0, -1)).trim(),
    ).toHexString();
  } else {
    return new TinyColor(color).toHexString();
  }
}

export function validateInterval(interval: string, prefix: string): number {
  const parsed = parse(interval);
  if (parsed === null) {
    throw new Error(`'${prefix}: ${interval}' is not a valid range of time`);
  }
  return parsed;
}

export function validateOffset(interval: string, prefix: string): number {
  if (interval[0] !== '+' && interval[0] !== '-') {
    throw new Error(`'${prefix}: ${interval}' should start with a '+' or a '-'`);
  }
  return validateInterval(interval, prefix);
}

export function offsetData(data: EntityCachePoints, offset: number | undefined): EntityCachePoints {
  if (offset) {
    const lData = JSON.parse(JSON.stringify(data));
    lData.forEach((entry) => {
      entry[0] = entry[0] - offset;
    });
    return lData;
  }
  return data;
}

export function prettyPrintTime(value: string | number | null, unit: ChartCardPrettyTime): string {
  if (value === null) return NO_VALUE;
  return moment.duration(value, unit).format('y[y] d[d] h[h] m[m] s[s] S[ms]', { trim: 'both' });
}

export function getPercentFromValue(value: number, min: number | undefined, max: number | undefined): number {
  const lMin = min === undefined ? DEFAULT_MIN : min;
  const lMax = max === undefined ? DEFAULT_MAX : max;
  return ((value - lMin) * 100) / (lMax - lMin);
}
