/**
 * Restricts a route to one or more roles. Must run after `protect`,
 * which populates req.user.
 *
 * Usage: router.post('/doctors', protect, authorize('admin'), createDoctor)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user.role}' is not permitted to perform this action`,
      });
    }
    next();
  };
}

/**
 * Allows access if the requester owns the resource (matches :userId /
 * req.params.id against req.user._id) OR has one of the given roles.
 * Useful for e.g. patients viewing their own records while doctors/
 * admins retain full access.
 */
function authorizeOwnerOrRoles(paramName, ...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    const targetId = req.params[paramName];
    const isOwner = targetId && targetId === req.user._id.toString();
    const hasRole = allowedRoles.includes(req.user.role);
    if (!isOwner && !hasRole) {
      return res.status(403).json({ message: 'Not authorized to access this resource' });
    }
    next();
  };
}

module.exports = { authorize, authorizeOwnerOrRoles };
