const requirePermission = (permission) => (req, res, next) => {
    const permissions = req.auth?.payload?.permissions ?? [];
    if (!permissions.includes(permission)) {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
    }
    next();
};

module.exports = { requirePermission };