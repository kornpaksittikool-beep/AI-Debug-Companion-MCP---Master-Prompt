# สรุปความสามารถของ AI Engineering Platform MCP

เอกสารนี้สรุปแบบภาษาคนว่า MCP ตัวนี้ทำอะไรได้บ้าง ณ Phase 37 โดยเน้นความสามารถที่ใช้ช่วยงานพัฒนา software จริง ไม่ใช่รายละเอียดเชิง implementation

## ภาพรวม

AI Engineering Platform MCP คือระบบช่วยงานวิศวกรรมซอฟต์แวร์ที่ทำหน้าที่รวบรวมหลักฐานจากโปรเจ็กต์ แล้วส่งข้อมูลให้ AI ใช้วิเคราะห์ ตัดสินใจ วางแผน แก้ไข และตรวจสอบงานได้ปลอดภัยขึ้น

ปัจจุบันระบบทำได้หลัก ๆ ดังนี้

- ตรวจสอบสถานะของ MCP server ว่าพร้อมใช้งานหรือไม่
- บอกได้ว่ามีเครื่องมืออะไรให้ใช้บ้าง โดยมีโหมดสรุปที่ประหยัด token
- สำรวจโครงสร้าง repository แบบจำกัดขอบเขต และมี compact project profile/file excerpt สำหรับสรุปโปรเจ็กต์แบบประหยัด token
- ค้นหาไฟล์ โค้ด symbol import graph และ call graph
- อ่านข้อมูล database แบบ read-only
- อ่านข้อมูล git history, blame และความเสี่ยงจากไฟล์ที่เปลี่ยนบ่อย
- สร้าง investigation session เพื่อเก็บหลักฐาน สมมติฐาน และข้อสรุป
- สร้างแผนแก้ไขและ impact report ก่อนลงมือแก้
- สร้าง patch proposal ขอ approval แล้วค่อย apply
- rollback patch ที่ apply ไปแล้วได้
- รัน verification command ที่อยู่ใน allow list
- เก็บ project memory แบบ versioned
- ตรวจ security risk เบื้องต้น
- จัดการ plugin lifecycle แบบมีแผนและไม่ execute code มั่ว
- ตรวจ compatibility ของ plugin
- รองรับ AI provider metadata หลายเจ้าโดยไม่ผูกกับ provider เดียว
- ประเมิน token และช่วยบีบ context
- มี question-type token profiles สำหรับ summary, tech stack quick view, debug, code review และ planning
- แต่ละ profile มี `maxBytes`, จำนวน excerpt สูงสุด, hard do-not-call tools และ telemetry budget status
- `repository.project_profile` มี summary mode ที่ลดจำนวน key files, entrypoints, extensions และไม่ส่ง largest files สำหรับ summary สั้น
- `repository.search_files` มี summary mode ที่จำกัดผลลัพธ์สูงสุด 8 รายการและไม่ส่ง preview หนัก ๆ กลับมา
- summary strict mode จะไม่เรียก `repository.search_files`, architecture docs, source tree summary หรือ app module excerpt เป็น default ถ้า README/package เพียงพอแล้ว
- summary startup mode จะไม่เรียก `platform.tool_summary` เป็น default ถ้าเป็น explicit project summary และ `repository.project_profile` ใช้งานได้
- adaptive workflow gate จะใช้ gate สั้นสำหรับงาน read-only เช่น summary และใช้ gate เต็มสำหรับงานแก้โค้ดหรือ execution
- default report mode เป็น `normal_user_summary` เพื่อให้ gate, footer, evidence และ token report สั้นสำหรับผู้ใช้ทั่วไป
- ถ้าผู้ใช้ถามหา tools used, telemetry, token detail, evidence detail หรือ debug MCP จึงค่อยใช้ `debug_telemetry` ที่แสดงรายละเอียดมากขึ้น
- เก็บ telemetry ว่า MCP ถูกใช้อย่างไร และ tool ไหนกิน token เยอะ

## Platform และ Health

- ตรวจว่า MCP server ยังตอบสนองอยู่หรือไม่
- ดูชื่อ platform, version และ phase ปัจจุบัน
- ดูจำนวน tool ทั้งหมดที่ register อยู่
- ดูสรุป tool แยกตาม module แบบประหยัด token
- ใช้เช็กก่อนเริ่มงานว่า Codex ต่อ MCP ได้จริงหรือยัง

ตัวอย่างการใช้งาน:

- ถามว่า "MCP ใช้ได้ไหม"
- ถามว่า "ตอนนี้มี tools อะไรบ้างแบบสรุป"
- เช็กว่า session นี้ใช้ Phase ล่าสุดหรือยัง

## Investigation

- สร้าง session สำหรับสืบสวน bug, error, log, stack trace, requirement หรือ feature request
- เก็บหลักฐานพร้อมแหล่งที่มา
- บันทึก hypothesis หรือข้อสันนิษฐานระหว่างสืบสวน
- บันทึกว่าเคยเข้าไปดูไฟล์ API database หรือ resource ไหนแล้ว
- สรุป investigation ปัจจุบัน
- ปิด investigation ด้วยข้อสรุปที่อ้างอิงหลักฐาน

ใช้กับงานแบบนี้:

- debug error ที่ยังไม่รู้ root cause
- วิเคราะห์ issue ก่อนแก้
- เก็บหลักฐานก่อนเสนอแผน
- ป้องกัน AI เดาโดยไม่มี evidence

## Repository Intelligence

- ดูภาพรวม repository เช่นจำนวนไฟล์และชนิดไฟล์
- scan repository แบบ bounded ไม่อ่านทั้ง repo แบบไม่มีขอบเขต
- ค้นหาไฟล์ตาม path, extension หรือ text preview
- อ่าน context ของไฟล์แบบจำกัดขนาด
- อ่าน context ของ module
- ค้นหา TypeScript/JavaScript symbol เช่น class, function, method, interface, type, enum
- อ่าน context รอบ symbol ที่ต้องการ
- สร้าง import graph เพื่อดูว่าไฟล์ไหน import ไฟล์ไหน
- สร้าง call graph แบบ best-effort
- สร้างและตรวจสถานะ persistent repository index
- ค้นหาข้ามหลาย repository ได้

ใช้กับงานแบบนี้:

- หา entry point ของ feature
- ดูว่าแก้ไฟล์หนึ่งแล้วกระทบไฟล์ไหน
- หา class/function ที่เกี่ยวกับ bug
- ทำความเข้าใจ module โดยไม่ต้องอ่านทั้ง repo
- รองรับ monorepo หรือหลาย repo ในอนาคต

## Database Intelligence

- อ่าน schema ของ SQLite แบบ read-only
- อ่าน relation และ foreign key
- preview query แบบ read-only พร้อมจำกัด row
- บอก dialect ที่รองรับ เช่น SQLite, PostgreSQL, MySQL
- validate connection profile ของ PostgreSQL/MySQL โดยไม่รับ password ใน MCP input
- ปิดการ execute network database จริงไว้ก่อนจนกว่าจะมี policy ที่ปลอดภัยกว่า

ใช้กับงานแบบนี้:

- เข้าใจ table และ column ก่อนแก้ business logic
- ตรวจ relation ของข้อมูล
- preview ข้อมูลเล็กน้อยโดยไม่เขียน database
- วางแผนรองรับ database อื่นในอนาคต

## Git Intelligence

- อ่าน recent commits
- อ่าน blame ของไฟล์เพื่อดูว่า line ไหนมาจาก commit/author ไหน
- ดู commit history ของไฟล์
- สรุป impact hint จากไฟล์ที่เปลี่ยนบ่อยหรือมี history เสี่ยง

ใช้กับงานแบบนี้:

- หา context ว่าโค้ดส่วนนี้เพิ่งเปลี่ยนจากอะไร
- ดูไฟล์ที่เสี่ยง regression
- ช่วยตัดสินใจว่าควรแก้แบบเล็กหรือควรวางแผน refactor
- อ้างอิง git evidence ก่อนสรุป root cause

## Planning และ Impact

- สร้าง engineering plan จาก objective, scope และหลักฐาน
- รองรับระดับแผน เช่น quick fix, normal fix, refactor, architecture change
- สร้าง impact report ก่อนแก้จริง
- ระบุไฟล์ module API database frontend backend cache queue worker event และ regression risk ที่อาจกระทบ
- มี approval gate ก่อน patch execution
- สรุป plan ที่เคยสร้างไว้

ใช้กับงานแบบนี้:

- วางแผนก่อนแก้ bug
- วิเคราะห์ผลกระทบก่อนเปลี่ยน architecture
- ขออนุมัติก่อนลงมือแก้
- ทำให้ทุกการแก้มี plan และตรวจย้อนหลังได้

## Patch และ Verification

- สร้าง patch proposal จากแผนที่ approved แล้ว
- ดู proposal ก่อน apply จริง
- สร้าง rollback plan
- apply patch แบบ deterministic whole-file operation
- เก็บ snapshot ก่อน apply เพื่อ rollback
- rollback patch apply run ได้
- รัน verification command ที่ผ่าน allow list เท่านั้น
- สรุปผล verification เช่น passed, failed, stdout, stderr, exit code และ duration

ใช้กับงานแบบนี้:

- แก้ไฟล์อย่างมี approval
- rollback เมื่อ verification ไม่ผ่าน
- ตรวจ build/test/lint หลังแก้
- ลดความเสี่ยงจากการแก้ไฟล์แบบสุ่ม

## Project Memory

- บันทึก memory ของโปรเจ็กต์แบบ versioned
- ค้นหา memory ตามคำค้น category หรือ tag
- สรุป memory ที่มีอยู่
- refresh/rebuild memory snapshot
- export memory ออกมาใช้อ้างอิง

ใช้กับงานแบบนี้:

- เก็บ architecture decision
- เก็บ business term เช่น SO, PO, Invoice, Payment
- เก็บ naming convention หรือ coding standard
- เก็บ known issue และ common bug
- ทำให้ AI จำบริบทของโปรเจ็กต์ได้ต่อเนื่องขึ้น

## Performance และ Security

- มี cache foundation สำหรับ workflow ที่ต้อง scan ซ้ำ
- ดู cache summary
- invalidate cache ตาม namespace หรือ key
- audit project แบบ read-only เพื่อหา prompt injection marker หรือ secret marker
- audit permission ของ MCP tools
- ตรวจ tool ที่มี write, command, network หรือ git permission กว้างเกินไป

ใช้กับงานแบบนี้:

- ลดการอ่าน repo ซ้ำ
- ตรวจความเสี่ยงก่อนให้ AI ใช้ context
- ป้องกัน path traversal, command injection และ prompt injection ในระดับ policy
- ตรวจว่า tool ใหม่มี permission สมเหตุสมผลหรือไม่

## Plugin Marketplace และ Plugin Lifecycle

- แสดง catalog ของ plugin ที่รู้จัก
- validate plugin manifest
- ตรวจ schema, permission, timeout และ retry strategy ของ plugin
- ตรวจ compatibility กับ platform, Node.js และ runtime
- สร้าง install/remove/update plan โดยยังไม่ execute code
- เปิด/ปิด local plugin ผ่าน state metadata
- stage update ของ plugin แบบตรวจสอบได้
- เก็บ lifecycle result พร้อม rollback และ verification plan
- stage remote plugin metadata โดยไม่ download หรือ execute code
- verify remote artifact ด้วย SHA-256 จาก content ที่ให้มา
- ดู inventory ของ staged remote plugins

ใช้กับงานแบบนี้:

- เพิ่ม tool ใหม่โดยไม่แก้ core
- ตรวจ plugin ก่อนนำเข้า platform
- ทำ marketplace workflow แบบปลอดภัย
- แยก core ออกจาก plugin ตามแนวคิด loose coupling

## AI Provider Boundary

- เก็บ metadata ของ provider เช่น OpenAI, Claude, Gemini, DeepSeek, Ollama, OpenRouter และ local LLM
- ดู provider metadata
- validate AI request โดยไม่เรียก API จริง
- สร้าง routing plan ว่าควรใช้ provider/model ไหนโดยไม่ผูกกับเจ้าเดียว

ใช้กับงานแบบนี้:

- วางแผนเปลี่ยน model โดยไม่กระทบ core
- ตรวจ request ก่อนส่งให้ provider จริงในอนาคต
- รองรับ multi-provider architecture
- ป้องกัน platform กลายเป็นระบบที่ผูกกับ AI เจ้าเดียว

## Token Budget และ Context Compression

- ประเมิน token ของ context ที่จะส่งให้ AI
- compress context ตาม priority เพื่อให้อยู่ใน budget
- แนะนำ strategy ว่าควรใช้ MCP tools อะไรก่อนเพื่อลด token
- คืน `defaultReportMode=normal_user_summary` และ `debugReportTriggers` เพื่อให้ client เลือกระดับรายงานได้
- สำหรับ `project_summary` คืน `fallbackPolicy.neverUseBroadFileContext=true`
- fallback order ของ summary คือ `project_profile -> read_file_excerpt -> answer_with_limited_evidence -> ask_for_debug_detail`
- แยก profile ตามประเภทคำถาม พร้อม target โดยประมาณ:
  - summary: ประมาณ 1k-2k tokens
    - ใช้ excerpt 1 ครั้งถ้าพอ และไม่เกิน 2 ครั้ง โดย `purpose=summary` และ `maxBytes<=700`
    - ถ้า excerpt ใช้ไม่ได้ ให้ตอบจาก `repository.project_profile` และ evidence ที่มีอยู่ ไม่ fallback ไป `repository.read_file_context`
  - tech stack / architecture quick view: ประมาณ 1.5k-2.5k tokens
  - debug ทั่วไป: ประมาณ 3k-8k tokens
  - code review: อ่านเฉพาะ diff/files impacted และ related tests
  - planning: ใช้ roadmap/TODO/phase report แบบ excerpt ก่อนอ่านเต็ม
- ใช้ช่วยตัดสินใจว่า context ไหนควรส่งหรือไม่ควรส่ง

ใช้กับงานแบบนี้:

- ลด token จากการอ่านไฟล์ใหญ่เกินจำเป็น
- เลือก evidence ที่สำคัญที่สุดก่อนส่งให้ AI
- วาง workflow แบบ token-aware
- ช่วยให้ conversation ยาว ๆ ยังควบคุม context ได้

## Integration Telemetry

- สร้าง integration session สำหรับ Codex หรือ MCP client อื่น
- บันทึก tool usage
- เช็ก readiness ว่า client ต่อ MCP ถูกต้องหรือไม่
- สรุป telemetry ว่าใช้ MCP ไปกี่ครั้ง
- flush telemetry ลง local state
- โหลด telemetry กลับมาสรุป
- มี workflow index บอกว่างานประเภทไหนควรเริ่มจาก tools ใด
- workflow index แต่ละ entry มี target token range, `gateMode`, `defaultReportMode`, `debugReportTriggers` และ context policy เพื่อบังคับให้เริ่มจาก evidence ที่เล็กพอ
- ถ้า telemetry เกิน target range จะคืน `budgetStatus.status` เป็น `over_budget`
- บันทึก automatic execution telemetry ของทุก MCP tool call
- สรุป estimated token ของ input/output ต่อ tool
- reset automatic telemetry ได้

ใช้กับงานแบบนี้:

- พิสูจน์ว่า Codex ใช้ MCP จริง
- ดูว่า tool ไหนกิน token เยอะ
- วัดผลหลัง optimize เช่นจาก `platform.metadata` ไปเป็น `platform.tool_summary`
- ทำรายงานหลังจบงานว่า MCP ถูกใช้กับอะไรบ้าง
- รายงานแบบปกติควรบอกแค่ว่า MCP ถูกใช้หรือไม่, evidence เป็นชื่อสั้น ๆ เช่น README/package และ token summary หนึ่งบรรทัด
- ถ้า summary fallback ใช้ broad context ให้รายงานสั้น ๆ ว่า `Token: over target; summary fallback used broad context, next run should stay profile/excerpt only`
- รายงานแบบ debug ค่อยแสดง tools used, path/detail, largest token source, over-budget detail และ fallback detail
- ถ้า `project_summary` มี largest token source เป็น `repository.read_file_context` ให้ถือว่าเป็น `summary fallback violation` และแนะนำใช้เฉพาะ project profile/excerpt

## สิ่งที่ยังไม่ใช่ความสามารถปัจจุบัน

- ยังไม่ได้เป็น exact Codex billing token จริง เพราะต้องรอ Codex host ส่ง model usage metadata ให้ tool หรือ thread
- ยังไม่เรียก AI provider API จริง
- ยังไม่ execute PostgreSQL/MySQL network query จริง
- ยังไม่ auto apply patch โดยไม่มี approval
- ยังไม่ install หรือ execute remote plugin code โดยตรง
- ยังไม่มี distributed cache หรือ cloud sync
- ยังไม่มี vector memory
- ยังไม่ใช่ระบบ UI overlay ใน Codex

## สถานะล่าสุดที่ควรเห็นเมื่อทดสอบ MCP

ค่าที่ควรเห็นจาก Phase 38:

- `platform.health` เป็น `ok`
- phase เป็น `phase-38-summary-fallback-discipline`
- จำนวน tools ทั้งหมดเป็น `84`
- ใช้ `platform.tool_summary` ได้
- `token_budget.recommend_strategy` คืน `questionProfile` พร้อม `gateMode`, `defaultReportMode` และ `debugReportTriggers` สำหรับประเภทคำถามที่ระบุหรือ infer ได้
- `project_summary` strategy และ workflow มี `fallbackPolicy.neverUseBroadFileContext=true`
- summary/purpose prompt ควรใช้ `gateMode=compact_read_only`, `defaultReportMode=normal_user_summary` และ gate สั้น 1-2 บรรทัด
- summary/purpose prompt ไม่ควรเรียก `repository.search_symbols` เป็น default เพราะ broad symbol output อาจกิน token เกินเป้า
- summary/purpose prompt ควรเรียก `repository.project_profile` ด้วย `mode=summary`
- summary/purpose prompt ไม่ควรเรียก `repository.search_files` เป็น default ถ้า `repository.project_profile mode=summary` หา README/package ได้แล้ว
- summary/purpose prompt ไม่ควรเรียก `platform.tool_summary` เป็น default ถ้าเป็น explicit skill summary
- summary/purpose prompt ห้าม fallback ไป `repository.read_file_context`; ถ้า excerpt ใช้ไม่ได้ให้ตอบแบบ limited evidence หรือเสนอ debug telemetry/excerpt retry
- summary/purpose prompt ไม่ควรอ่าน `docs/architecture.md`, source tree summary หรือ app module excerpt ถ้าไม่ได้ถาม architecture/module/source structure
- `integration.auto_telemetry_summary` รับ `questionType` หรือ `targetTokens` แล้วรายงาน `budgetStatus`
- ไม่ควร fallback ไป `platform.metadata` ถ้าแค่ต้องการดู tool summary
- `integration.auto_telemetry_summary` ต้องรายงาน `toolCalls`, `successfulCalls`, `failedCalls`, `estimatedTotalTokens` และ `topTools`

## วิธีคิดง่าย ๆ

MCP ตัวนี้ไม่ได้มีหน้าที่คิดแทน AI ทั้งหมด แต่มีหน้าที่หาหลักฐานจากโปรเจ็กต์อย่างเป็นระบบ แล้วช่วยให้ AI ตอบหรือแก้โค้ดโดยอิงความจริงมากขึ้น

สรุปสั้น ๆ:

- MCP หา evidence
- AI วิเคราะห์ evidence
- Planning engine วางแผน
- Approval gate กันการแก้มั่ว
- Patch engine แก้แบบ rollback ได้
- Verification engine ตรวจผล
- Telemetry บอกว่าใช้ MCP และ token ไปเท่าไร
