import { TeamEntity } from 'src/modules/teams/entities/team.entity';
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

  @ManyToOne(() => TeamEntity, (team) => team.leaders, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'team_id' })
  team: TeamEntity | null;
}
