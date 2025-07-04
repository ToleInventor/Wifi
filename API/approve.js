const { exec } = require('child_process');

module.exports = async (req, res) => {
    const { ip, action } = req.query;
    
    if (!ip || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip)) {
        return res.status(400).send('Invalid IP');
    }

    try {
        const cmd = action === 'approve' 
            ? `iptables -I FORWARD -s ${ip} -j ACCEPT`
            : `iptables -D FORWARD -s ${ip} -j ACCEPT`;
        
        exec(`sshpass -p "${process.env.ROUTER_PASS}" ssh -o StrictHostKeyChecking=no ${process.env.ROUTER_USER}@${process.env.ROUTER_IP} "${cmd}"`, (error) => {
            if (error) return res.status(500).send('Router update failed');
            res.send(`IP ${ip} ${action}d successfully`);
        });
    } catch (error) {
        res.status(500).send('Server error');
    }
};
