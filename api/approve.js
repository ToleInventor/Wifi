const { exec } = require('child_process');

module.exports = async (req, res) => {
    const { ip, action, secret } = req.query;
    
    // Security check
    if (secret !== process.env.SECRET_KEY) {
        return res.status(403).json({ error: "Unauthorized" });
    }

    // IP validation
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        return res.status(400).json({ error: "Invalid IP format" });
    }

    try {
        const command = action === 'approve'
            ? `iptables -I FORWARD -s ${ip} -j ACCEPT`
            : `iptables -D FORWARD -s ${ip} -j ACCEPT`;

        exec(
            `sshpass -p "${process.env.ROUTER_PASS}" ssh -o StrictHostKeyChecking=no ${process.env.ROUTER_USER}@${process.env.ROUTER_IP} "${command}"`,
            (error) => {
                if (error) {
                    console.error("Router command failed:", error);
                    return res.status(500).json({ error: "Router update failed" });
                }
                res.json({ 
                    status: "success",
                    message: `IP ${ip} ${action}d successfully` 
                });
            }
        );
    } catch (error) {
        console.error("Server error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
