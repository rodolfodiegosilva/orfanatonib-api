import { BaseEntity } from 'src/share/share-entity/base.entity';
import { Entity, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { AddressEntity } from 'src/modules/addresses/entities/address.entity/address.entity';
import { TeacherProfileEntity } from 'src/modules/teacher-profiles/entities/teacher-profile.entity/teacher-profile.entity';
import { LeaderProfileEntity } from 'src/modules/leader-profiles/entities/leader-profile.entity/leader-profile.entity';
import { ShelteredEntity } from 'src/modules/sheltered/entities/sheltered.entity';
import { RouteEntity } from 'src/route/route-page.entity';

@Entity('shelters')
export class ShelterEntity extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToOne(() => AddressEntity, { cascade: true, eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'address_id' })
  address: AddressEntity;

  @OneToMany(() => TeacherProfileEntity, (tp) => tp.shelter, { cascade: false })
  teachers: TeacherProfileEntity[];

  @OneToMany(() => LeaderProfileEntity, (lp) => lp.shelter, { 
    cascade: false,
    eager: false 
  })
  leaders: LeaderProfileEntity[];

  @OneToMany(() => ShelteredEntity, (sheltered) => sheltered.shelter, { cascade: false })
  sheltered: ShelteredEntity[];

  @OneToOne(() => RouteEntity, {
    cascade: true,
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  route?: RouteEntity | null;

  // Relação polimórfica unilateral com MediaItemEntity (apenas uma imagem)
  // O mediaItem é buscado usando targetId = shelter.id e targetType = 'ShelterEntity'
  // Sempre será do tipo MediaType.IMAGE
  mediaItem?: any; // Será populado via query manual no repository
}
