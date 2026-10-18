import { join } from "node:path";
import { unlinkSync, existsSync } from "node:fs";

const testDbPath = join(process.cwd(), "data", "prizmaa-test-sandbox.sqlite");
process.env.PRIZMAA_DB_PATH = testDbPath;

if (existsSync(testDbPath)) {
  try { unlinkSync(testDbPath); } catch {}
}

const store = await import("../lib/prizmaa/store.ts");

console.log("=== PRIZMAA AUTOMATED INTEGRATION TEST SUITE ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (!condition) {
    failed++;
    console.error(`❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    passed++;
    console.log(`✅ PASS: ${message}`);
  }
}

try {
  // Test 1: Age validation (<18 must fail)
  try {
    store.register({
      handle: "underage_test",
      nickname: "Young",
      password: "valid_password_12345",
      age: 17,
      adult: false,
      acceptRules: true
    });
    assert(false, "Registration under 18 should throw ApiError");
  } catch (e) {
    assert(e.code === "INVALID_REGISTRATION", "Registration under 18 rejected with INVALID_REGISTRATION");
  }

  // Test 2: User A registration
  const tokenA = store.register({
    handle: "denis_berlin",
    nickname: "Denis",
    password: "secure_password_denis_2026",
    age: 28,
    adult: true,
    acceptRules: true
  });
  assert(typeof tokenA === "string" && tokenA.length > 20, "User A registered and received session token");

  const userA = store.currentUser(tokenA);
  assert(userA !== null, "User A session resolves to member ID");

  // Test 3: User B registration
  const tokenB = store.register({
    handle: "alex_koeln",
    nickname: "Alex",
    password: "secure_password_alex_2026",
    age: 31,
    adult: true,
    acceptRules: true
  });
  const userB = store.currentUser(tokenB);
  assert(userB !== null, "User B registered and session resolves");

  // Test 4: Profile setup with Avatar, Role & Tags
  store.setProfile(userA, {
    nickname: "Denis B.",
    age: 28,
    city: "Berlin",
    intent: "Dating",
    bio: "Art and architecture lover.",
    visible: true,
    avatar_color: "emerald",
    avatar_icon: "star",
    role: "Vers",
    tags: "Art,Design,Coffee"
  });
  const profileA = store.self(userA);
  assert(profileA.nickname === "Denis B." && profileA.visible === 1, "User A profile updated and marked visible");
  assert(profileA.avatar_color === "emerald" && profileA.avatar_icon === "star", "User A avatar attributes saved");
  assert(profileA.role === "Vers" && profileA.tags === "Art,Design,Coffee", "User A role and tags saved");

  store.setProfile(userB, {
    nickname: "Alex K.",
    age: 31,
    city: "Köln",
    intent: "Dating",
    bio: "Design researcher in Rheinland.",
    visible: true,
    avatar_color: "rose",
    avatar_icon: "prism",
    role: "Top",
    tags: "Design,Tech,Travel"
  });
  const profileB = store.self(userB);
  assert(profileB.nickname === "Alex K." && profileB.visible === 1, "User B profile updated and marked visible");

  // Test 5: Discovery (people) & Filtering
  const discoverA = store.people(userA);
  assert(discoverA.length === 1 && discoverA[0].id === userB, "User A sees User B in discovery, but not self");
  assert(discoverA[0].avatar_color === "rose" && discoverA[0].role === "Top", "Discovery payload includes avatar & role");

  // Tag filter test
  const filteredByTag = store.people(userA, { tag: "Tech" });
  assert(filteredByTag.length === 1 && filteredByTag[0].id === userB, "Filter by tag 'Tech' finds User B");

  const filteredByMismatchTag = store.people(userA, { tag: "Nightlife" });
  assert(filteredByMismatchTag.length === 0, "Filter by missing tag returns 0");

  // Search query test
  const searchedByCity = store.people(userA, { search: "Köln" });
  assert(searchedByCity.length === 1, "Search by city 'Köln' finds User B");

  // Test 6: One-sided like (no match yet)
  const likeResult1 = store.like(userA, userB);
  assert(likeResult1.liked === true && likeResult1.mutual === false, "User A likes User B: like recorded, not mutual yet");
  assert(store.isMatch(userA, userB) === false, "isMatch returns false before reciprocal like");

  // Test 7: Unauthorized chat attempt (must fail without mutual match)
  try {
    store.send(userA, userB, "Hey, can you read this?");
    assert(false, "Sending message without mutual match must fail");
  } catch (e) {
    assert(e.code === "MATCH_REQUIRED", "Premature message blocked with MATCH_REQUIRED");
  }

  // Test 8: Reciprocal like -> Mutual Match unlocked!
  const likeResult2 = store.like(userB, userA);
  assert(likeResult2.liked === true && likeResult2.mutual === true, "User B likes User A: mutual match created!");
  assert(store.isMatch(userA, userB) === true, "isMatch returns true for both users");

  const matchesA = store.matches(userA);
  assert(matchesA.length === 1 && matchesA[0].id === userB, "Matches list for User A contains User B");

  // Test 9: Private bidirectional messaging & Read receipts
  const msg1 = store.send(userA, userB, "Hi Alex! Love your profile.");
  assert(typeof msg1.id === "string" && msg1.body === "Hi Alex! Love your profile.", "User A sent message to User B");

  // User B's match list should now show 1 unread message from User A
  const matchesBBeforeRead = store.matches(userB);
  assert(matchesBBeforeRead[0].unread_count === 1, "User B sees 1 unread message in matches list");

  // User B opens chat with User A -> marks messages as read
  const threadB = store.chat(userB, userA);
  assert(threadB.length === 1, "User B reads chat thread");

  // User B's unread count is now 0
  const matchesBAfterRead = store.matches(userB);
  assert(matchesBAfterRead[0].unread_count === 0, "User B unread count cleared after opening chat");

  const msg2 = store.send(userB, userA, "Hi Denis! Great to connect.");
  assert(typeof msg2.id === "string", "User B replied to User A");

  const threadA = store.chat(userA, userB);
  assert(threadA.length === 2, "Chat thread contains both messages in chronological order");

  // Test 9.5: Monetization & "Who Liked Me" Paywall (Tinder Gold/Grindr model)
  const tokenD = store.register({
    handle: "marcus_munich",
    nickname: "Marcus",
    password: "secure_password_marcus_2026",
    age: 29,
    adult: true,
    acceptRules: true
  });
  const userD = store.currentUser(tokenD);
  store.setProfile(userD, { nickname: "Marcus M.", age: 29, city: "München", intent: "Hookup", bio: "Visiting Berlin next week.", visible: true });
  store.like(userD, userA);

  const whoLikedFree = store.whoLikedMe(userA);
  assert(whoLikedFree.locked === true && whoLikedFree.count === 1 && whoLikedFree.people.length === 0, "Free user sees locked count without revealing identities");

  assert(typeof store.upgradeVip === "undefined", "Unverified VIP entitlement mutation is not exported");
  const whoLikedStillLocked = store.whoLikedMe(userA);
  assert(whoLikedStillLocked.locked === true && whoLikedStillLocked.count === 1 && whoLikedStillLocked.people.length === 0, "No paid feature unlocks without independently verified payment");

  // Test 10: GDPR Data Export
  const exportA = store.exportData(userA);
  assert(exportA.profile.handle === "denis_berlin", "Export contains correct profile handle");
  assert(exportA.profile.is_vip === 0, "Export preserves unpaid user status");
  assert(exportA.matches_count === 1, "Export contains matches count");
  assert(exportA.messages.length === 2, "Export contains complete chat history");

  // Test 11: Safety & Blocking
  store.block(userA, userB);
  assert(store.isMatch(userA, userB) === false, "Block immediately breaks mutual match");

  const discoverAfterBlock = store.people(userA);
  assert(!discoverAfterBlock.some(p => p.id === userB), "Blocked user immediately removed from discovery");

  try {
    store.send(userA, userB, "Are you there?");
    assert(false, "Message after block must fail");
  } catch (e) {
    assert(e.code === "MATCH_REQUIRED", "Messaging blocked after block action");
  }

  // Test 12: Safety & Reporting
  const tokenC = store.register({
    handle: "troll_user",
    nickname: "Troll",
    password: "password_troll_123",
    age: 24,
    adult: true,
    acceptRules: true
  });
  const userC = store.currentUser(tokenC);
  store.setProfile(userC, {
    nickname: "Troll",
    age: 24,
    city: "Nowhere",
    intent: "Flirting",
    bio: "Spam bio",
    visible: true
  });

  const reportResult = store.report(userA, userC, "Harassment");
  assert(reportResult.blocked === true, "Reporting user automatically triggers block");

  // Test 13: Complete Account Deletion (GDPR / self-erasure)
  const eraseResult = store.erase(userC);
  assert(eraseResult.deleted === true, "Account erase returns deleted: true");
  assert(store.self(userC) === undefined, "Erased user completely deleted from database");

  console.log("\n=========================================");
  console.log(`🎉 ALL TESTS PASSED! (${passed}/${passed})`);
  console.log("=========================================\n");

} catch (err) {
  console.error("Test execution failed:", err);
  process.exit(1);
} finally {
  if (existsSync(testDbPath)) {
    try { unlinkSync(testDbPath); } catch {}
  }
}
