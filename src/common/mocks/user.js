export default {
    id : 1,
    name : 'Joe Shmoe',
    email : 'foo@bar.baz',
    account:  'foo@bar.baz',
    remoteUser : {
        name : 'Joe Shmoe',
        email : 'foo@bar.baz',
        account:  'foo@bar.baz',
        dbUser : {
            newUser : false,
        }
    }
}

export const newUser = {
    id : 1,
    name : 'Joe Shmoe',
    email : 'foo@bar.baz',
    account:  'foo@bar.baz',
    remoteUser : {
        name : 'Joe Shmoe',
        email : 'foo@bar.baz',
        account:  'foo@bar.baz',
        dbUser : {
            newUser : true,
        }
    }
}

export const sharingUser = {
    id : 1,
    name : 'Sharing Shmoe',
    email : 'foo@bar.baz',
    account:  'foo@bar.baz',
    remoteUser : {
        name : 'Joe Shmoe',
        email : 'foo@bar.baz',
        account:  'foo@bar.baz',
        dbUser : {
            newUser : false,
            linkedAccounts : ['foo@boo.bar','boo@bang.baz']
        }
    }
}



export const otherUser = {
    id : 2,
    name : 'Fred Shormgashborg',
    email : 'fred@foo.bar',
    account : 'fred@foo.bar'
}
