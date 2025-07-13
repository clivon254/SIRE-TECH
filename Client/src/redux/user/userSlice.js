
import {createSlice} from "@reduxjs/toolkit"

const initialState = {
    User:null,
    loading:false,
    error:null
}

const userSlice = createSlice({
    name:"user",
    initialState,
    reducers:{

        signInStart:(state) => {

            state.loading = true ;

            state.error = null
        },

        signInSuccess:(state,action) => {

            state.loading = false ;

            state.error = null;

            state.User = action.payload 
        },

        signInFailure:(state,action) => {

            state.loading = false

            state.error = action.payload
        },

        updateUserStart:(state) => {

            state.loading = true

            state.error = null
        },

        updateUserSuccess:(state,action) => {

            state.loading = false

            state.error = null

            state.User = action.payload
        },

        updateUserFailure:(state,action) => {

            state.loading = false

            state.error = action.payload
        },

        deleteUserSuccess:(state) => {

            state.User = null

            state.loading = false

            state.error = null
        },

        deleteUserFailure:(state,action) => {

            state.loading = false

            state.error = action.payload
        },

        signOutSuccess:(state) => {

            state.User = null

            state.error = null

            state.loading = false
        }

    }
})


export const {
    signInStart,
    signInSuccess,
    signInFailure,
    updateUserSuccess,
    updateUserStart,
    updateUserFailure,
    deleteUserFailure,
    deleteUserSuccess,
    signOutSuccess
} 
 = userSlice.actions


 export default userSlice.reducer
