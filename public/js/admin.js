const deleteProduct = (btn) => {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=_csrf]').value;

    /* In JavaScript, the "closest" function is a method used with the 
    Document Object Model (DOM). It is typically used to find the closest 
    ancestor of an HTML element that matches a specified CSS selector. 
    This method is useful when you want to traverse up the DOM hierarchy to find 
    a particular ancestor. */

    const productElement = btn.closest('article');

    fetch(`/admin/product/${prodId}`, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
            /* we are sending our csrf token into the header because 
            it will not look only to the body but everywhere 
            i.e. params,headers everywhere and csrf token should be send on 
            every request for the robustness */
        }
    })
        .then(result => {
            return result.json();
        })
        .then(data => {
            console.log(data);
            productElement.parentNode.removeChild(productElement);
        })
        .catch(err => {
            console.log(err);
        })
};