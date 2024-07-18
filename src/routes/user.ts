import {Router} from 'express';
import {signup, signin, forgetPassword, resetPassword} from '../controllers/userController';
import {authenticate} from '../middlewares/authMiddleware';

const user = Router();

user.post('/signup', signup);
user.post('/signin', signin);
user.post('/forget-password', forgetPassword);
user.post('/reset-password', authenticate, resetPassword);


export default user;