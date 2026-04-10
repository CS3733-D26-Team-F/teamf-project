import { Request, Response, NextFunction } from 'express';

export const requireRole = (...allowedRoles: string[]) =>
    async (req: Request, res: Response, next: NextFunction) => {
        const auth0Id  = req.auth!.payload.sub as string;
        const employee = await prisma.employee.findUnique({ where: { auth0Id } });

        if (!employee || !allowedRoles.includes(employee.persona)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };