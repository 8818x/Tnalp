import bcrypt from 'bcryptjs';

const data = {
    users: [
        {
            name: 'Tnalp',
            email: 'tnalp@tnalp.com',
            password: bcrypt.hashSync('tnalp'),
            isAdmin: true,
        },
        {
            name: 'Admin',
            email: 'admin@tnalp.com',
            password: bcrypt.hashSync('admin'),
            isAdmin: true,
        }
    ],
    products: [
        {
            name: 'Garden Pot I',
            slug: 'garden-pot-i',
            category: 'Pot',
            image: '/images/1.png',
            price: 499,
            countInStock: 0,
            brand: 'Tnalp',
            rating: '0',
            numReviews: 0,
            description: 'High-quality garden plot from Tnalp',
        },
        {
            name: 'Garden Pot II',
            slug: 'garden-pot-ii',
            category: 'Pot',
            image: '/images/2.png',
            price: 499,
            countInStock: 99,
            brand: 'Tnalp',
            rating: '0',
            numReviews: 0,
            description: 'High-quality garden plot from Tnalp',
        },
        {
            name: 'Garden Pot III',
            slug: 'garden-pot-iii',
            category: 'Pot',
            image: '/images/3.png',
            price: 499,
            countInStock: 99,
            brand: 'Tnalp',
            rating: '0',
            numReviews: 0,
            description: 'High-quality garden plot from Tnalp',
        },
        {
            name: 'Garden Pot IV',
            slug: 'garden-pot-iv',
            category: 'Pot',
            image: '/images/4.png',
            price: 499,
            countInStock: 99,
            brand: 'Tnalp',
            rating: '0',
            numReviews: 0,
            description: 'High-quality garden plot from Tnalp',
        },
        {
            name: 'Garden Pot V',
            slug: 'garden-pot-v',
            category: 'Pot',
            image: '/images/5.png',
            price: 499,
            countInStock: 99,
            brand: 'Tnalp',
            rating: '0',
            numReviews: 0,
            description: 'High-quality garden plot from Tnalp',
        },
        {
            name: 'Garden Pot VI',
            slug: 'garden-pot-vi',
            category: 'Pot',
            image: '/images/6.png',
            price: 499,
            countInStock: 8,
            brand: 'Tnalp',
            rating: '0',
            numReviews: 0,
            description: 'High-quality garden plot from Tnalp',
        },
    ]
};

export default data;