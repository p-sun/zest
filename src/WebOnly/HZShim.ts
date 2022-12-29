// SHIM HORIZON (Don't copy into Horizon, import it instead) ------------------
export class Vec3 {
  x: number
  y: number
  z: number

  constructor(x: number, y: number, z: number) {
    this.x = x
    this.y = y
    this.z = z
  }

  equals(vec: Vec3): boolean {
    return this.x == vec.x && this.y == vec.y && this.z == vec.z
  }

  toString(): string {
    return 'Vec3(' + this.x + ', ' + this.y + ', ' + this.z + ')'
  }

  static get zero(): Vec3 {
    return new Vec3(0, 0, 0)
  }
}
