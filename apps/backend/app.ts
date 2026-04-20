import express from 'express';
import morgan from 'morgan';
import cors from 'cors';



import employeeRoutes from './routes/employees.js';
import contentRoutes from './routes/contentforms.js';
import loginRoutes from './routes/login.js';

const app = express();
const port = process.env.PORT || 3000;
app.use(cors({
    origin: ["http://localhost:5173", "http://localhost:5175", "https://cs3733.lunarflame.dev"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));

//Legacy imports
//Shoudl be refactored so tag the stuff is in its own file
//And then these imports are not needed
import path from 'path';
import dotenv from 'dotenv';
import pkg from '@prisma/client';
import {PrismaPg} from "@prisma/adapter-pg";
const { PrismaClient } = pkg;
const distPath = path.resolve("../frontend/dist");
app.use(cors());
import { auth } from "express-oauth2-jwt-bearer";
dotenv.config();
const adapter = new PrismaPg({
    connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({adapter});
const checkJWT = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,
    tokenSigningAlg: 'RS256'
});
//End of stuff that needs to be there for the below tag code to work

app.post('/newtag', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Must name the tag' })
    };

    try {

        const newTag = await prisma.metatags.create({
            data: {
                tag_name: name
            },
        });


        return res.status(200).json({
            message: 'new tag added',
            data: newTag
        });
    } catch (error) {
        res.status(500).json({ error: 'Cannot add a tag' });
    }
});

app.post('/assigntag', checkJWT, async(req, res) => {
    console.log("Made it here!")
    const auth0Id = req.auth!.payload.sub as string;
    console.log("req", req)
    console.log("req.body", req.body)
    const idInt = Number(req.body.id);
    const metidInt = Number(req.body.metid);
    console.log("Backend Recived", idInt, metidInt)

    const form = await prisma.contentform.findUnique({
        where: { id: idInt }
    });

    const tag = await prisma.metatags.findUnique({
        where: { metid: metidInt }
    });

    if (!form) {
        return res.status(400).json({ error: 'Form not found' });
    }

    if (!tag) {
        return res.status(400).json({ error: 'Tag not found' });
    }

    try {

        const assignTag = await prisma.jointagscontent.create({
            data: {
                id: form.id,
                metid: tag.metid
            },
        });

        if (assignTag){
            return res.status(200).json('Tag assigned');
        }
    } catch (error) {
        return res.status(500).json({error});
    }
});

app.get('/grabtaggedforms/:name', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const name = req.params.name;

    const tag = await prisma.metatags.findFirst({
        where: { tag_name: name }
    });

    if (!tag) {
        return res.status(400).json('No Tag by This Name');
    }

    try {
        const join = await prisma.jointagscontent.findMany({
            where: {metid: tag.metid}
        });

        const tagged = join.map(formid => formid.id);

        console.log(tagged);

        const forms= await prisma.contentform.findMany({
            where: {
                id: { in: tagged }
            }
        })

        return res.status(200).json({data: forms});

    } catch (error) {
        res.status(500).json({ error: 'Cannot find forms with this tag' });
    }
})

app.get('/grabformtags/:name', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const name = req.params.name;

    const form = await prisma.contentform.findFirst({
        where: { name: name }
    });

    if (!form) {
        return res.status(400).json('No Tag by This Name');
    }

    try {
        const join = await prisma.jointagscontent.findMany({
            where: {id: form.id}
        });

        const tagged = join.map(tagid => tagid.metid);

        console.log(tagged);

        const tags= await prisma.metatags.findMany({
            where: {
                metid: { in: tagged }
            }
        })

        return res.status(200).json({data: tags});

    } catch (error) {
        res.status(500).json({ error: 'Cannot find tags for this form' });
    }
})

app.delete('/unassigntag', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const idInt = Number(req.body.id);
    const metidInt = Number(req.body.metid);

    try {
        const removeTag = await prisma.jointagscontent.deleteMany({
            where: {
                id: idInt,
                metid: metidInt
            }
        })

        if (removeTag) {
            return res.status(200).json({message: 'Tag removed', data: removeTag});
        }
    } catch (error) {
        res.status(500).json({ error: 'Cannot remove a tag' });
    }
})

app.delete('/deletetag/:name', checkJWT, async(req, res) => {
    const auth0Id = req.auth!.payload.sub as string;
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Must include the tag' })
    };

    try {

        const deletedTag = await prisma.metatags.delete({
            where: { tag_name: name }
        });


        return res.status(200).json({
            message: 'tag deleted',
            data: deletedTag
        });
    } catch (error) {
        res.status(500).json({ error: 'Cannot remove a tag' });
    }
});
app.get('/getTags', async (req, res) => {
    console.log("get Tags called in backend")
    const tags = await prisma.metatags.findMany();
    console.log('Tags: ', tags);
    //res.json(tags);
    //return res.status(200).json({data: tags})
    return res.json({data: tags})
});


//The new code from refactoring app.ts
//Needs to be after old code so old code still works
app.get ('/', (req, res) => {
    res.status(200);
})

app.use('/', employeeRoutes);
app.use('/', contentRoutes);
app.use('/', loginRoutes);




app.use((req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
});

// Start server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});



export default app;
