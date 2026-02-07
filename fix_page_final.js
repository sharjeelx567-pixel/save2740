const fs = require('fs');

const filePath = "b:\\save 2740 app\\frontend\\app\\group-contribution\\page.tsx";
const content = fs.readFileSync(filePath, 'utf8');

const anchor = '    {/* Transactions Section */ }';
// Note: The spaces in comment might have been fixed by my regex?? 
// My previous script fixed < Card so maybe it didn't fix the comment spaces.
// Let's find the card class line instead.

const anchor2 = 'Recent Transactions</h3>';
const parts = content.split(anchor2);

if (parts.length > 1) {
    // Keep the first part (up to "Recent Transactions</h3>")
    const header = parts[0] + 'Recent Transactions</h3>';

    // Define the footer correctly
    const footer = `
                        <div className="space-y-3">
                          {transactions.length === 0 ? (
                            <p className="text-slate-500 text-center py-8">No transactions yet</p>
                          ) : (
                            transactions.map((txn) => (
                              <div key={txn.id || Math.random()} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-brand-green/10 flex items-center justify-center flex-shrink-0">
                                    <ArrowRight className="w-5 h-5 text-brand-green" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-slate-900 truncate">{txn.memberName}</p>
                                    <p className="text-xs text-slate-500">{txn.description}</p>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-4">
                                  <p className="font-bold text-slate-900">\${txn.amount}</p>
                                  <p className="text-xs text-slate-500">{new Date(txn.paidAt).toLocaleDateString()}</p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                </div>
              </div>
            </>
          )}

          </div>
        </div>
      </main>

      {/* Join Group Modal */}
      <Sheet open={showNewMemberModal} onOpenChange={setShowNewMemberModal}>
        <SheetContent side="right" className="w-full sm:w-96">
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-2">Join Group</h2>
            <p className="text-slate-500 mb-6">Enter the referral code to join this group</p>

            <form onSubmit={handleJoinGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">Referral Code</label>
                <input
                  type="text"
                  required
                  value={joinData.referralCode}
                  onChange={(e) => setJoinData({ referralCode: e.target.value })}
                  placeholder="e.g., FC2024"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-green uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-green hover:bg-brand-green/90 text-dark-navy px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin inline" /> : "Join Group"}
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

export default function GroupContributionPage() {
  return (
    <ProtectedPage>
      <GroupContributionPageContent />
    </ProtectedPage>
  )
}
`;

    fs.writeFileSync(filePath, header + footer);
    console.log("Successfully rewrote file footer");
} else {
    console.log("Could not find anchor point");
}
