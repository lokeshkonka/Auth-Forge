import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { SessionsService } from '../../sessions/sessions.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../../audit/services/audit.service';
import { TokenBlacklistService } from '../../common/services/token-blacklist.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    member: {
      findUnique: jest.fn(),
    },
    memberSession: {
      findMany: jest.fn(),
    },
  };

  const mockSessionsService = {
    findSessionsByMemberId: jest.fn(),
    revokeAllSessions: jest.fn(),
  };

  const mockJwtService = {};
  const mockConfigService = {};
  const mockAuditService = {};
  const mockTokenBlacklistService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SessionsService, useValue: mockSessionsService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: TokenBlacklistService, useValue: mockTokenBlacklistService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSessions', () => {
    it('should return sessions with current flag', async () => {
      const memberId = 'member-1';
      const currentSessionId = 'session-1';
      interface Session {
        id: string;
        userAgent: string;
      }
      const mockSessions: Session[] = [
        { id: 'session-1', userAgent: 'agent-1' },
        { id: 'session-2', userAgent: 'agent-2' },
      ];

      (mockSessionsService.findSessionsByMemberId as jest.Mock).mockResolvedValue(mockSessions);

      const result = await service.getSessions(memberId, currentSessionId);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data[0].current).toBe(true);
      expect(result.data[1].current).toBe(false);
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all other sessions', async () => {
      const memberId = 'member-1';
      const currentSessionId = 'session-1';

      (mockSessionsService.revokeAllSessions as jest.Mock).mockResolvedValue({ count: 5 });

      const result = await service.revokeAllSessions(memberId, currentSessionId);

      expect(result.success).toBe(true);
      expect(result.message).toContain('revoked successfully');
      expect(mockSessionsService.revokeAllSessions).toHaveBeenCalledWith(memberId, currentSessionId);
    });
  });
});
