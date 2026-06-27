import { Injectable } from '@nestjs/common';

@Injectable()
export class CommandPolicyService {
  isAllowed(command: string, allowList: readonly string[]): boolean {
    return allowList.includes(command);
  }
}
