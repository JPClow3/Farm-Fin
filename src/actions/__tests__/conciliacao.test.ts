import { describe, it, expect } from 'vitest';
import { uploadOFX, autoMatchTransactions } from '../conciliacao';

describe('Conciliação Server Actions', () => {
  it('processes valid OFX file content', async () => {
    const validOFX = `<OFX>
<SIGNONMSGSRSV1><SONRS><STATUS><CODE>0<SEVERITY>INFO</STATUS></SONRS></SIGNONMSGSRSV1>
<BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN>
<TRNTYPE>DEBIT
<DTPOSTED>20260814
<TRNAMT>-145000.00
<MEMO>PAGTO YARA BRASIL FERTILIZANTES
<FITID>OFX-20260814-001
</STMTTRN>
<STMTTRN>
<TRNTYPE>CREDIT
<DTPOSTED>20260815
<TRNAMT>480000.00
<MEMO>TED RECEBIMENTO BUNGE BRASIL SOJA
<FITID>OFX-20260815-002
</STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1>
</OFX>`;

    const result = await uploadOFX(validOFX);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.matches).toBeGreaterThan(0);
      expect(result.data.message).toBeDefined();
    }
  });

  it('rejects empty or invalid OFX file content', async () => {
    const result = await uploadOFX('');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeDefined();
    }
  });

  it('executes autoMatchTransactions successfully', async () => {
    const result = await autoMatchTransactions();
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.matchesFound).toBeGreaterThanOrEqual(0);
    }
  });
});
