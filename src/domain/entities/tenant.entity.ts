export interface TenantProps {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly createdAt: Date;
}

export class Tenant {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly createdAt: Date;

  constructor(props: TenantProps) {
    this.id = props.id;
    this.name = props.name;
    this.slug = props.slug;
    this.createdAt = props.createdAt;
  }
}
