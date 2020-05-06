export default async function (event, context, user) {
    console.log('setup running...');
    if (user && user.email=='tmhinkle@gmail.com') {
        return {message:'Congratulations, you are allowed via my hard-coded non-secure security magic!'}
    }
    else {
        return {message:'No way sir, no how no go: user not permitted!!,',
                user:user||'no user logged in'}
    }
}
