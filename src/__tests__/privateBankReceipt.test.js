import { beforeEach, expect, it, vi } from 'vitest';
import handler from '../../api/payment/bank-transfer.js';
import { getSupabaseAdmin } from '../../api/_lib/linepay.js';
vi.mock('../../api/_lib/linepay.js', () => ({ getSupabaseAdmin: vi.fn() }));
const receipt='887f6b32-ec2c-405d-9a5c-89ac65cf15e9';
const valid={method:'POST',body:{orderId:'ORD-123456',receipt}};
function response(){return {status:vi.fn().mockReturnThis(),setHeader:vi.fn(),json:vi.fn()};}
function lookup(data){const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn().mockResolvedValue({data,error:null})};getSupabaseAdmin.mockReturnValue({from:()=>query});return query;}
beforeEach(()=>{vi.clearAllMocks();vi.stubEnv('PAYMENT_BANK_NAME','Test bank');vi.stubEnv('PAYMENT_ACCOUNT','test account');});
it('requires the private checkout receipt',async()=>{const res=response();await handler({method:'POST',body:{orderId:'ORD-123456'}},res);expect(res.status).toHaveBeenCalledWith(400);expect(getSupabaseAdmin).not.toHaveBeenCalled();});
it('withholds bank instructions from an unmatched receipt',async()=>{lookup(null);const res=response();await handler(valid,res);expect(res.status).toHaveBeenCalledWith(404);});
it('returns only bank and account for a matching pending transfer',async()=>{const q=lookup({id:receipt});const res=response();await handler(valid,res);expect(q.eq.mock.calls).toEqual([['id',receipt],['order_id','ORD-123456'],['payment_method','bank_transfer'],['payment_status','pending']]);expect(res.setHeader).toHaveBeenCalledWith('Cache-Control','private, no-store, max-age=0');expect(res.json).toHaveBeenCalledWith({bank:'Test bank',account:'test account'});});
it('rejects public GET requests',async()=>{const res=response();await handler({method:'GET'},res);expect(res.status).toHaveBeenCalledWith(405);expect(getSupabaseAdmin).not.toHaveBeenCalled();});
