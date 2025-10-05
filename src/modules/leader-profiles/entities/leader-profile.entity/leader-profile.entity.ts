import { ShelterEntity } from 'src/modules/shelters/entities/shelter.entity/shelter.entity';
import { BaseEntity } from 'src/share/share-entity/base.entity';
import { UserEntity } from 'src/user/user.entity';
import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  Unique,
  ManyToOne,
} from 'typeorm';

@Unique('UQ_leader_profile_user', ['user'])
@Entity('leader_profiles')
export class LeaderProfileEntity extends BaseEntity {
  @Column({ type: 'boolean', default: true })
  active: boolean;

  @OneToOne(() => UserEntity, (user) => user.leaderProfile, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => ShelterEntity, (shelter) => shelter.leaders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'shelter_id' })
  shelter: ShelterEntity | null;
}
