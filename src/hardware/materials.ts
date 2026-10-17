// src/hardware/materials.ts
import { MATERIALS } from '../theme/tokens';

export function getMaterialStyles(name: string) {
  const keys = Object.keys(MATERIALS) as Array<keyof typeof MATERIALS>;
  const validKey = (keys.includes(name as any) ? name : keys[0]) as keyof typeof MATERIALS;
  return MATERIALS[validKey];
}