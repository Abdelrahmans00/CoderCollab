import { Router } from 'express';
import { register, login, me } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateDto } from "../../middleware/validate.dto";
import { RegisterDto, LoginDto } from "./dto";

const router = Router();

router.post('/register', validateDto(RegisterDto), register);
router.post('/login', validateDto(LoginDto), login);
router.get('/me', authenticate, me);

export default router;