const { exec } = require('child_process');

module.exports = async (req, res) => {
    const { ip, action } = req.body;

    if (!ip || !['grant', 'revoke'].includes(action)) {
        return res.status(400).json({ error: "Bad request" });
    }

    try {
        const command = action === 'grant'
            ? `iptables -I FORWARD -s ${ip} -j ACCEPT`
            : `iptables -D FORWARD -s ${ip} -j ACCEPT`;

        exec(
            `sshpass -p "${process.env.ROUTER_PASS}" ssh -o StrictHostKeyChecking=no ${process.env.ROUTER_USER}@${process.env.ROUTER_IP} "${command}"`,
            (error) => {
                if (error) {
                    console.error("Temp access failed:", error);
                    return res.status(500).json({ error: "Router command failed" });
                }

                // Auto-revoke after 5 minutes for grants
                if (action === 'grant') {
                    setTimeout(() => {
                        exec(`iptables -D FORWARD -s ${ip} -j ACCEPT`);
                    }, 300000);
                }

                res.json({ 
                    status: "success",
                    access: action === 'grant' ? "granted" : "revoked",
                    duration: action === 'grant' ? "5 minutes" : "immediate"
                });
            }
        );
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
