const { exec } = require('child_process');

module.exports = async (req, res) => {
    const { ip, action } = req.body;
    
    try {
        const cmd = action === 'grant' 
            ? `iptables -I FORWARD -s ${ip} -j ACCEPT`
            : `iptables -D FORWARD -s ${ip} -j ACCEPT`;
        
        exec(`sshpass -p "${process.env.ROUTER_PASS}" ssh -o StrictHostKeyChecking=no ${process.env.ROUTER_USER}@${process.env.ROUTER_IP} "${cmd}"`, (error) => {
            if (error) return res.status(500).json({ error: "Router update failed" });
            
            if (action === 'grant') {
                setTimeout(() => {
                    exec(`sshpass -p "${process.env.ROUTER_PASS}" ssh -o StrictHostKeyChecking=no ${process.env.ROUTER_USER}@${process.env.ROUTER_IP} "iptables -D FORWARD -s ${ip} -j ACCEPT"`);
                }, 300000); // 5 minutes
            }
            
            res.json({ success: true });
        });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
};
