import { Hono } from 'hono';
import type { HonoEnv } from '../env';

import auth from './auth';
import dashboard from './dashboard';
import school from './school';
import upload from './upload';
import kelas from './kelas';
import mapel from './mapel';
import guru from './guru';
import siswa from './siswa';
import ujian from './ujian';
import admin from './admin';
import guruUjian from './guru-ujian';
import guruNilai from './guru-nilai';
import guruDashboard from './guru-dashboard';
import bankSoal from './bank-soal';
import siswaUjian from './siswa-ujian';
import notifications from './notifications';
import publicRoutes from './public';
import superadmin from './superadmin';

const routes = new Hono<HonoEnv>();

// Mount all routes (migrated to raw SQL with Neon)
routes.route('/auth', auth);
routes.route('/dashboard', dashboard);
routes.route('/school', school);
routes.route('/upload', upload);
routes.route('/kelas', kelas);
routes.route('/mapel', mapel);
routes.route('/guru', guru);
routes.route('/siswa', siswa);
routes.route('/ujian', ujian);
routes.route('/admin', admin);
routes.route('/guru/ujian', guruUjian);
routes.route('/guru/nilai', guruNilai);
routes.route('/guru/dashboard', guruDashboard);
routes.route('/guru/bank-soal', bankSoal);
routes.route('/siswa/ujian', siswaUjian);
routes.route('/notifications', notifications);
routes.route('/public', publicRoutes);
routes.route('/superadmin', superadmin);

export default routes;
